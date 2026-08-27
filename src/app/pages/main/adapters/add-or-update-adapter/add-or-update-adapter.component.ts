import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IntegrationHubService, AdapterInfo } from '@/app/core/services/integration-hub.service';

@Component({
  selector: 'app-add-or-update-adapter',
  standalone: false,
  templateUrl: './add-or-update-adapter.component.html',
  styleUrls: ['./add-or-update-adapter.component.scss'],
})
export class AddOrUpdateAdapterModalComponent implements OnInit {
  readonly nzModalData = inject(NZ_MODAL_DATA, { optional: true }) as { adapter?: AdapterInfo } | null;

  form!: FormGroup;
  loading = false;
  isEdit = false;

  categories = [
    { label: 'Nhắn tin & Thông báo (Messaging)', value: 'Messaging' },
    { label: 'Cổng thanh toán & QR (Payment)', value: 'Payment' },
    { label: 'Tin nhắn SMS Brandname (SMS)', value: 'SMS' },
    { label: 'Vận chuyển & Giao vận (Shipping)', value: 'Shipping' },
    { label: 'HTTP Webhook (Webhook)', value: 'Webhook' },
    { label: 'Tùy chỉnh khác (Custom)', value: 'Custom' },
  ];

  httpMethods = ['POST', 'GET', 'PUT', 'PATCH'];
  authTypes = ['None', 'Bearer', 'ApiKey', 'Basic', 'Custom'];
  fieldTypes = [
    { label: 'Văn bản (Text)', value: 'text' },
    { label: 'Mật khẩu / Bí mật (Password)', value: 'password' },
    { label: 'Văn bản dài (Textarea)', value: 'textarea' },
    { label: 'Đúng / Sai (Boolean)', value: 'boolean' },
  ];

  colorPresets = [
    '#3b82f6', '#0068ff', '#10b981', '#f59e0b', '#ee0033', '#ae2070', '#8b5cf6', '#06b6d4', '#6366f1', '#2c5f2e'
  ];

  newEventType = '';

  constructor(
    private fb: FormBuilder,
    private modalRef: NzModalRef,
    private hubService: IntegrationHubService,
    private msg: NzMessageService
  ) {}

  ngOnInit(): void {
    const data = this.nzModalData?.adapter;
    this.isEdit = !!data;

    this.form = this.fb.group({
      providerCode: [
        { value: data?.providerCode ?? '', disabled: this.isEdit },
        [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)],
      ],
      displayName: [data?.displayName ?? '', [Validators.required]],
      description: [data?.description ?? ''],
      category: [data?.category ?? 'Custom', [Validators.required]],
      icon: [data?.icon ?? 'api'],
      color: [data?.color ?? '#3b82f6'],
      isActive: [data?.isActive ?? true],
      baseUrl: [data?.baseUrl ?? '', [Validators.required]],
      httpMethod: [data?.httpMethod ?? 'POST', [Validators.required]],
      authType: [data?.authType ?? 'None', [Validators.required]],
      supportedEventTypes: this.fb.array([]),
      requiredCredentialFields: this.fb.array([]),
      supportsInboundWebhook: [data?.supportsInboundWebhook ?? false],
      webhookSignatureHeader: [data?.webhookSignatureHeader ?? ''],
      webhookSecretKeyName: [data?.webhookSecretKeyName ?? ''],
    });

    // Populate events
    const events = data?.supportedEventTypes && data.supportedEventTypes.length > 0
      ? data.supportedEventTypes
      : ['*'];
    events.forEach((evt) => this.addEventControl(evt));

    // Populate credential fields
    if (data?.requiredCredentialFields && data.requiredCredentialFields.length > 0) {
      data.requiredCredentialFields.forEach((f) => this.addCredentialFieldControl(f));
    } else {
      this.addCredentialFieldControl({
        key: 'ApiKey',
        label: 'API Key / Secret',
        type: 'password',
        isRequired: true,
        placeholder: 'Nhập API key từ nhà cung cấp',
      });
    }
  }

  get supportedEventsArray(): FormArray {
    return this.form.get('supportedEventTypes') as FormArray;
  }

  get credentialFieldsArray(): FormArray {
    return this.form.get('requiredCredentialFields') as FormArray;
  }

  addEventControl(evt: string): void {
    if (!evt || !evt.trim()) return;
    const clean = evt.trim();
    if (!this.supportedEventsArray.value.includes(clean)) {
      this.supportedEventsArray.push(this.fb.control(clean));
    }
  }

  addNewEvent(): void {
    if (this.newEventType.trim()) {
      this.addEventControl(this.newEventType.trim());
      this.newEventType = '';
    }
  }

  removeEvent(index: number): void {
    this.supportedEventsArray.removeAt(index);
  }

  addCredentialFieldControl(field?: {
    key: string;
    label: string;
    type: string;
    isRequired: boolean;
    placeholder?: string;
    description?: string;
  }): void {
    this.credentialFieldsArray.push(
      this.fb.group({
        key: [field?.key ?? '', [Validators.required, Validators.pattern(/^[a-zA-Z0-9_]+$/)]],
        label: [field?.label ?? '', [Validators.required]],
        type: [field?.type ?? 'text', [Validators.required]],
        isRequired: [field?.isRequired ?? true],
        placeholder: [field?.placeholder ?? ''],
        description: [field?.description ?? ''],
      })
    );
  }

  removeCredentialField(index: number): void {
    this.credentialFieldsArray.removeAt(index);
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((c) => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.loading = true;
    const rawVal = this.form.getRawValue();

    const payload = {
      providerCode: rawVal.providerCode?.trim().toUpperCase(),
      displayName: rawVal.displayName?.trim(),
      description: rawVal.description?.trim(),
      category: rawVal.category,
      icon: rawVal.icon?.trim(),
      color: rawVal.color,
      isActive: rawVal.isActive,
      baseUrl: rawVal.baseUrl?.trim(),
      httpMethod: rawVal.httpMethod,
      authType: rawVal.authType,
      supportedEventTypes: rawVal.supportedEventTypes || ['*'],
      requiredCredentialFields: rawVal.requiredCredentialFields || [],
      supportsInboundWebhook: rawVal.supportsInboundWebhook,
      webhookSignatureHeader: rawVal.webhookSignatureHeader?.trim(),
      webhookSecretKeyName: rawVal.webhookSecretKeyName?.trim(),
    };

    const obs = this.isEdit && this.nzModalData?.adapter?.id
      ? this.hubService.updateAdapter(this.nzModalData.adapter.id, payload)
      : this.hubService.createAdapter(payload);

    obs.subscribe({
      next: () => {
        this.msg.success(this.isEdit ? 'Cập nhật Adapter thành công!' : 'Tạo mới Adapter thành công!');
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
