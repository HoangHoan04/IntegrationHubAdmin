import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { IntegrationHubService, AdapterInfo } from '@/app/core/services/integration-hub.service';

@Component({
  selector: 'app-adapters',
  standalone: false,
  templateUrl: './adapters.component.html',
  styleUrls: ['./adapters.component.scss']
})
export class AdaptersComponent implements OnInit {
  loading = false;
  adapters: AdapterInfo[] = [];

  constructor(
    private hubService: IntegrationHubService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.hubService.getAdapters().subscribe({
      next: (res) => {
        this.adapters = res || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  getProviderIcon(code: string): string {
    const map: Record<string, string> = {
      ZALO_OA: '💬',
      VNPAY: '💳',
      MOMO: '🟣',
      VIETQR: '📱',
      TELEGRAM: '✈️',
      CUSTOM_WEBHOOK: '🔗'
    };
    return map[code] ?? '⚙️';
  }

  getProviderColor(code: string): string {
    const map: Record<string, string> = {
      ZALO_OA: '#0068ff',
      VNPAY: '#ee0033',
      MOMO: '#ae2070',
      VIETQR: '#2c5f2e',
      TELEGRAM: '#229ed9',
      CUSTOM_WEBHOOK: '#6366f1'
    };
    return map[code] ?? '#888';
  }
}
