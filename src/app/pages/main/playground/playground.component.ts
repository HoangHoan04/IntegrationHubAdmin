import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IntegrationHubService } from '@/app/core/services/integration-hub.service';

@Component({
  selector: 'app-playground',
  standalone: false,
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.scss']
})
export class PlaygroundComponent {
  form: FormGroup;
  loading = false;
  result: any = null;
  resultStatus: 'success' | 'error' | null = null;

  providers = ['ZALO_OA', 'VNPAY', 'MOMO', 'VIETQR', 'TELEGRAM', 'CUSTOM_WEBHOOK'];

  defaultPayloads: Record<string, string> = {
    ZALO_OA: JSON.stringify({
      sourceSystem: 'HRM',
      eventType: 'hrm.employee.created',
      payload: {
        templateId: 'template_001',
        phone: '0912345678',
        templateData: { name: 'Nguyễn Văn A', orderId: 'ORD-001', amount: '500,000 đ' }
      }
    }, null, 2),
    VNPAY: JSON.stringify({
      sourceSystem: 'WMS',
      eventType: 'wms.order.created',
      payload: {
        orderId: 'TEST_ORDER_001',
        amount: 100000,
        orderDesc: 'Thanh toán đơn hàng TEST',
        returnUrl: 'https://example.com/return',
        clientIp: '127.0.0.1'
      }
    }, null, 2),
    MOMO: JSON.stringify({
      sourceSystem: 'WMS',
      eventType: 'wms.payment.request',
      payload: {
        orderId: 'MOMO_TEST_001',
        amount: 50000,
        orderInfo: 'Test payment',
        redirectUrl: 'https://example.com/redirect',
        ipnUrl: 'https://example.com/ipn',
        requestType: 'captureWallet'
      }
    }, null, 2),
    VIETQR: JSON.stringify({
      sourceSystem: 'TMS',
      eventType: 'tms.trip.payment',
      payload: {
        bankId: 'BIDV',
        accountNo: '1234567890',
        amount: 200000,
        description: 'Thanh toan don hang TEST-001'
      }
    }, null, 2),
    TELEGRAM: JSON.stringify({
      sourceSystem: 'EAM',
      eventType: 'eam.asset.maintenance_due',
      payload: {
        chatId: '-1001234567890',
        message: '🔔 Test message từ Integration Hub Admin'
      }
    }, null, 2),
    CUSTOM_WEBHOOK: JSON.stringify({
      sourceSystem: 'AUTH',
      eventType: 'auth.user.created',
      payload: {
        event: 'test_event',
        data: { userId: 'u123', action: 'ping' }
      }
    }, null, 2)
  };

  constructor(
    private fb: FormBuilder,
    private hubService: IntegrationHubService,
    private msg: NzMessageService
  ) {
    this.form = this.fb.group({
      providerCode: ['ZALO_OA', Validators.required],
      payload: [this.defaultPayloads['ZALO_OA'], [Validators.required]]
    });
  }

  onProviderChange(provider: string): void {
    this.form.patchValue({ payload: this.defaultPayloads[provider] ?? '{}' });
    this.result = null;
    this.resultStatus = null;
  }

  isValidJson(): boolean {
    try {
      JSON.parse(this.form.value.payload);
      return true;
    } catch {
      return false;
    }
  }

  formatPayload(): void {
    try {
      const parsed = JSON.parse(this.form.value.payload);
      this.form.patchValue({ payload: JSON.stringify(parsed, null, 2) });
    } catch {
      this.msg.warning('JSON không hợp lệ!');
    }
  }

  submit(): void {
    if (this.form.invalid || !this.isValidJson()) {
      this.msg.error('Vui lòng điền đầy đủ và kiểm tra JSON payload');
      return;
    }

    this.loading = true;
    this.result = null;
    this.resultStatus = null;

    const { payload } = this.form.value;
    const parsedPayload = JSON.parse(payload);

    this.hubService.publishEvent(parsedPayload).subscribe({
      next: (res: any) => {
        this.result = res;
        this.resultStatus = 'success';
        this.loading = false;
        this.msg.success('Gửi event thử nghiệm thành công!');
      },
      error: (err: any) => {
        this.result = err.error || { message: err.message };
        this.resultStatus = 'error';
        this.loading = false;
        this.msg.error('Thực thi event thất bại!');
      }
    });
  }

  formatResult(): string {
    if (!this.result) return '';
    try {
      return JSON.stringify(this.result, null, 2);
    } catch {
      return String(this.result);
    }
  }
}
