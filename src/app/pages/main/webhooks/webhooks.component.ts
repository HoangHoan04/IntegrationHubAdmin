import { enumData } from '@/app/core/constants/enums/enumData';
import { IntegrationHubService, WebhookLog } from '@/app/core/services/integration-hub.service';
import {
  CommonFilterActions,
  FilterAction,
  FilterConfig,
  FilterField,
} from '@/app/shared/components/filter-custom/filter-custom.types';
import {
  PaginationConfig,
  RowAction,
  TableAction,
  TableColumn,
  ToolbarConfig,
} from '@/app/shared/components/table-custom/table-custom.types';
import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-webhooks',
  standalone: false,
  templateUrl: './webhooks.component.html',
  styleUrls: ['./webhooks.component.scss'],
})
export class WebhooksComponent implements OnInit {
  data: WebhookLog[] = [];
  loading = false;

  pagination: PaginationConfig = {
    current: enumData.PAGE.PAGE_INDEX,
    pageSize: enumData.PAGE.PAGE_SIZE,
    total: enumData.PAGE.TOTAL,
    showTotal: true,
  };

  filters: Record<string, any> = {
    search: '',
    providerCode: null,
    httpMethod: null,
    isProcessed: null,
  };

  filterConfig: FilterConfig = {
    show: true,
    collapsible: true,
    defaultOpen: true,
    title: 'Bộ lọc tìm kiếm Webhook IPN Inbound',
    actionsAlign: 'center',
  };

  filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'Tìm kiếm',
      type: 'input',
      placeholder: 'Nội dung payload, IP hoặc mã lỗi...',
      col: 8,
      allowClear: true,
    },
    {
      key: 'providerCode',
      label: 'Provider',
      type: 'select',
      placeholder: 'Tất cả Provider',
      col: 5,
      allowClear: true,
      options: [
        { label: 'ZALO_OA', value: 'ZALO_OA' },
        { label: 'VNPAY', value: 'VNPAY' },
        { label: 'MOMO', value: 'MOMO' },
        { label: 'VIETQR', value: 'VIETQR' },
        { label: 'TELEGRAM', value: 'TELEGRAM' },
        { label: 'CUSTOM_WEBHOOK', value: 'CUSTOM_WEBHOOK' },
      ],
    },
    {
      key: 'httpMethod',
      label: 'HTTP Method',
      type: 'select',
      placeholder: 'Tất cả method',
      col: 5,
      allowClear: true,
      options: [
        { label: 'POST', value: 'POST' },
        { label: 'GET', value: 'GET' },
      ],
    },
    {
      key: 'isProcessed',
      label: 'Xử lý',
      type: 'select',
      placeholder: 'Tất cả trạng thái',
      col: 6,
      allowClear: true,
      options: [
        { label: 'Đã xử lý thành công', value: true },
        { label: 'Chưa xử lý / Lỗi', value: false },
      ],
    },
  ];

  filterActions: FilterAction[] = [
    CommonFilterActions.search(() => this.loadData(), this.loading),
    CommonFilterActions.clear(() => this.resetFilters()),
  ];

  toolbar: ToolbarConfig = {
    show: true,
  };

  toolbarActions: TableAction[] = [];

  columns: TableColumn<WebhookLog>[] = [
    {
      field: 'providerCode',
      header: 'Provider',
      type: 'tag',
      width: '160px',
      tagSeverity: () => 'primary',
    },
    {
      field: 'httpMethod',
      header: 'Method',
      type: 'tag',
      width: '100px',
      tagSeverity: (v) => (v === 'POST' ? 'success' : 'info'),
    },
    {
      field: 'isSignatureValid',
      header: 'Chữ ký',
      type: 'tag',
      width: '120px',
      tagSeverity: (v) => (v ? 'success' : 'danger'),
      render: (v) => (v ? 'Hợp lệ' : 'Lỗi/Không có'),
    },
    {
      field: 'isProcessed',
      header: 'Trạng thái xử lý',
      type: 'tag',
      width: '140px',
      tagSeverity: (v) => (v ? 'success' : 'warning'),
      render: (v) => (v ? 'Đã xử lý' : 'Chưa xử lý'),
    },
    {
      field: 'clientIp',
      header: 'Client IP',
      width: '140px',
      render: (v) => v || 'N/A',
    },
    {
      field: 'createdAt',
      header: 'Thời gian nhận',
      type: 'datetime',
      width: '160px',
    },
  ];

  rowActions: RowAction<WebhookLog>[] = [
    {
      key: 'view',
      label: 'Xem chi tiết',
      icon: 'eye',
      severity: 'primary',
      onClick: (record) => this.openDrawer(record),
    },
  ];

  // Drawer
  drawerVisible = false;
  selectedLog: WebhookLog | null = null;

  constructor(
    private readonly hubService: IntegrationHubService,
    private readonly message: NzMessageService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const body: Record<string, any> = {
      pageIndex: this.pagination.current,
      pageSize: this.pagination.pageSize,
    };

    if (this.filters['search']) body['search'] = this.filters['search'];
    if (this.filters['providerCode']) body['providerCode'] = this.filters['providerCode'];
    if (this.filters['httpMethod']) body['httpMethod'] = this.filters['httpMethod'];
    if (this.filters['isProcessed'] !== null && this.filters['isProcessed'] !== undefined) {
      body['isProcessed'] = this.filters['isProcessed'];
    }

    this.hubService.getWebhookLogs(body).subscribe({
      next: (res) => {
        this.data = res.items || [];
        this.pagination.total = res.totalCount || 0;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err?.error?.message || 'Không thể tải nhật ký webhook.');
      },
    });
  }

  onFiltersChange(newFilters: Record<string, any>): void {
    this.filters = { ...newFilters };
    this.pagination.current = 1;
    this.loadData();
  }

  resetFilters(): void {
    this.filters = {
      search: '',
      providerCode: null,
      httpMethod: null,
      isProcessed: null,
    };
    this.pagination.current = 1;
    this.loadData();
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.pagination.current = event.page;
    this.pagination.pageSize = event.pageSize;
    this.loadData();
  }

  onSortChange(_event: any): void {}

  openDrawer(log: WebhookLog): void {
    this.selectedLog = log;
    this.drawerVisible = true;
  }

  formatJson(json: string | null | undefined): string {
    if (!json) return '(không có)';
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  }

  getMethodColor(method: string): string {
    const map: Record<string, string> = {
      GET: 'blue',
      POST: 'green',
      PUT: 'orange',
      PATCH: 'cyan',
      DELETE: 'red',
    };
    return map[method?.toUpperCase()] ?? 'default';
  }
}
