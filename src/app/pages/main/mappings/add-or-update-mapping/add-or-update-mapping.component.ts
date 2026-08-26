import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IntegrationHubService, IntegrationMapping } from '@/app/core/services/integration-hub.service';

@Component({
  selector: 'app-add-or-update-mapping',
  standalone: false,
  templateUrl: './add-or-update-mapping.component.html',
  styleUrls: ['./add-or-update-mapping.component.scss']
})
export class AddOrUpdateMappingModalComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isEdit = false;
  mapping?: IntegrationMapping;

  sourceSystems = ['HRM', 'WMS', 'TMS', 'PMS', 'CMS', 'EAM', 'AUTH'];
  providers = ['ZALO_OA', 'VNPAY', 'MOMO', 'VIETQR', 'TELEGRAM', 'CUSTOM_WEBHOOK'];

  constructor(
    private fb: FormBuilder,
    private modalRef: NzModalRef,
    private msg: NzMessageService,
    private hubService: IntegrationHubService,
    @Optional() @Inject(NZ_MODAL_DATA) public modalData?: { mapping: IntegrationMapping }
  ) {}

  ngOnInit(): void {
    this.mapping = this.modalData?.mapping;
    this.isEdit = !!this.mapping;

    this.form = this.fb.group({
      name: [this.mapping?.name || '', [Validators.required, Validators.maxLength(200)]],
      sourceSystem: [this.mapping?.sourceSystem || 'HRM', [Validators.required]],
      eventType: [this.mapping?.eventType || '', [Validators.required, Validators.maxLength(100)]],
      providerCode: [this.mapping?.providerCode || 'ZALO_OA', [Validators.required]],
      isActive: [this.mapping?.isActive ?? true],
      description: [this.mapping?.description || ''],
      configJson: [this.mapping?.configJson || '{\n  \n}']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        if (c.invalid) {
          c.markAsDirty();
          c.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const val = this.form.value;

    // Validate JSON if not empty
    if (val.configJson && val.configJson.trim()) {
      try {
        JSON.parse(val.configJson);
      } catch (e) {
        this.msg.error('Cấu hình Config JSON không đúng định dạng JSON hợp lệ.');
        return;
      }
    }

    this.loading = true;

    if (this.isEdit && this.mapping) {
      this.hubService.updateMapping({ ...val, id: this.mapping.id }).subscribe({
        next: () => {
          this.msg.success('Cập nhật mapping thành công.');
          this.modalRef.close(true);
        },
        error: (err) => {
          this.loading = false;
          this.msg.error('Lỗi khi cập nhật: ' + (err.error?.message || err.message));
        }
      });
    } else {
      this.hubService.createMapping(val).subscribe({
        next: () => {
          this.msg.success('Tạo mới mapping thành công.');
          this.modalRef.close(true);
        },
        error: (err) => {
          this.loading = false;
          this.msg.error('Lỗi khi tạo: ' + (err.error?.message || err.message));
        }
      });
    }
  }

  onCancel(): void {
    this.modalRef.close(false);
  }
}
