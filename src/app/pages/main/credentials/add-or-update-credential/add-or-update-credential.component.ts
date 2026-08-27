import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IntegrationHubService, IntegrationCredential, AdapterInfo } from '@/app/core/services/integration-hub.service';

@Component({
  selector: 'app-add-or-update-credential',
  standalone: false,
  templateUrl: './add-or-update-credential.component.html',
})
export class AddOrUpdateCredentialModalComponent implements OnInit {
  readonly nzModalData = inject(NZ_MODAL_DATA, { optional: true }) as { credential?: IntegrationCredential } | null;

  form!: FormGroup;
  loading = false;
  isEdit = false;

  adapters: AdapterInfo[] = [];
  environments = ['Sandbox', 'Production'];

  currentFields: { key: string; label: string; type: string; isSecret: boolean; isRequired: boolean; placeholder?: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private modalRef: NzModalRef,
    private hubService: IntegrationHubService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    const data = this.nzModalData?.credential;
    this.isEdit = !!data;

    this.form = this.fb.group({
      name: [data?.name ?? '', [Validators.required]],
      providerCode: [data?.providerCode ?? null, [Validators.required]],
      environment: [data?.environment ?? 'Sandbox', [Validators.required]],
      companyName: [data?.companyName ?? ''],
      isActive: [data?.isActive ?? true],
      fields: this.fb.group({}),
    });

    this.hubService.getAdapters().subscribe({
      next: (adapters) => {
        this.adapters = adapters || [];
        if (data?.providerCode) {
          this.onProviderChange(data.providerCode);
        }
      },
    });
  }

  get fieldsGroup(): FormGroup {
    return this.form.get('fields') as FormGroup;
  }

  onProviderChange(providerCode: string): void {
    const adapter = this.adapters.find((a) => a.providerCode === providerCode);
    if (!adapter || !adapter.requiredCredentialFields) {
      this.currentFields = [];
    } else {
      this.currentFields = adapter.requiredCredentialFields.map((f) => ({
        key: f.key,
        label: f.label || f.key,
        type: f.type,
        isSecret: f.type === 'password',
        isRequired: f.isRequired,
        placeholder: f.placeholder,
      }));
    }

    const group = this.fb.group({});
    this.currentFields.forEach((f) => {
      group.addControl(
        f.key,
        this.fb.control('', f.isRequired ? [Validators.required] : [])
      );
    });
    this.form.setControl('fields', group);
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      Object.values(this.fieldsGroup.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.loading = true;
    const v = this.form.value;
    const payload = {
      id: this.isEdit ? this.nzModalData!.credential!.id : undefined,
      name: v.name,
      providerCode: v.providerCode,
      environment: v.environment,
      companyName: v.companyName,
      isActive: v.isActive,
      credentialFields: v.fields || {},
    };

    const obs = this.hubService.upsertCredential(payload);

    obs.subscribe({
      next: () => {
        this.msg.success(this.isEdit ? 'Cập nhật thành công!' : 'Tạo credential thành công!');
        this.loading = false;
        this.modalRef.close(true);
      },
      error: (err) => {
        this.msg.error('Lỗi: ' + (err.error?.message || err.message));
        this.loading = false;
      },
    });
  }

  cancel(): void {
    this.modalRef.close(false);
  }
}
