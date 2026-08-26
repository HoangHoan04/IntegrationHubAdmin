import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IntegrationHubService, IntegrationCredential } from '@/app/core/services/integration-hub.service';

@Component({
  selector: 'app-add-or-update-credential',
  standalone: false,
  templateUrl: './add-or-update-credential.component.html'
})
export class AddOrUpdateCredentialModalComponent implements OnInit {
  readonly nzModalData = inject(NZ_MODAL_DATA, { optional: true }) as { credential?: IntegrationCredential } | null;

  form!: FormGroup;
  loading = false;
  isEdit = false;

  providers = ['ZALO_OA', 'VNPAY', 'MOMO', 'VIETQR', 'TELEGRAM', 'CUSTOM_WEBHOOK'];
  environments = ['Sandbox', 'Production'];

  // Dynamic credential fields per provider
  credentialFields: Record<string, { key: string; label: string; isSecret: boolean }[]> = {
    ZALO_OA: [
      { key: 'appId', label: 'App ID', isSecret: false },
      { key: 'appSecret', label: 'App Secret', isSecret: true },
      { key: 'accessToken', label: 'Access Token', isSecret: true }
    ],
    VNPAY: [
      { key: 'tmnCode', label: 'TMN Code', isSecret: false },
      { key: 'hashSecret', label: 'Hash Secret', isSecret: true }
    ],
    MOMO: [
      { key: 'partnerCode', label: 'Partner Code', isSecret: false },
      { key: 'accessKey', label: 'Access Key', isSecret: true },
      { key: 'secretKey', label: 'Secret Key', isSecret: true }
    ],
    VIETQR: [
      { key: 'clientId', label: 'Client ID', isSecret: false },
      { key: 'apiKey', label: 'API Key', isSecret: true }
    ],
    TELEGRAM: [
      { key: 'botToken', label: 'Bot Token', isSecret: true },
      { key: 'chatId', label: 'Chat ID', isSecret: false }
    ],
    CUSTOM_WEBHOOK: [
      { key: 'endpointUrl', label: 'Endpoint URL', isSecret: false },
      { key: 'signingSecret', label: 'Signing Secret', isSecret: true }
    ]
  };

  currentFields: { key: string; label: string; isSecret: boolean }[] = [];

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
      fields: this.fb.group({})
    });

    if (data?.providerCode) {
      this.onProviderChange(data.providerCode);
    }
  }

  get fieldsGroup(): FormGroup {
    return this.form.get('fields') as FormGroup;
  }

  onProviderChange(provider: string): void {
    this.currentFields = this.credentialFields[provider] || [];
    const group = this.fb.group({});
    this.currentFields.forEach(f => {
      group.addControl(f.key, this.fb.control('', Validators.required));
    });
    this.form.setControl('fields', group);
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      Object.values(this.fieldsGroup.controls).forEach(c => {
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
      credentialFields: v.fields || {}
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
      }
    });
  }

  cancel(): void {
    this.modalRef.close(false);
  }
}
