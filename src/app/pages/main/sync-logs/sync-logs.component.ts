import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { IntegrationHubService, SyncLog } from '@/app/core/services/integration-hub.service';
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

@Component({
  selector: 'app-sync-logs',
  standalone: false,
  templateUrl: './sync-logs.component.html',
  styleUrls: ['./sync-logs.component.scss'],
})
export class SyncLogsComponent implements OnInit {
  data: SyncLog[] = [];
  loading = false;

  pagination: PaginationConfig = {
    current: 1,
    pageSize: 15,
    total: 0,
    showTotal: true,
  };

  filters: Record<string, any> = {
    search: '',
    sourceSystem: null,
    providerCode: null,
    status: null,
    dateRange: null,
  };

  filterConfig: FilterConfig = {
    show: true,
    collapsible: true,
    defaultOpen: true,
    title: 'Bộ lọc tìm kiếm Nhật ký Đồng bộ (Sync Logs)',
    actionsAlign: 'center',
  };

  filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'Tìm kiếm',
      type: 'input',
      placeholder: 'Loại sự kiện, mã lỗi hoặc idempotency key...',
      col: 8,
      allowClear: true,
    },
    {
      key: 'sourceSystem',
      label: 'Hệ thống nguồn',
      type: 'select',
      placeholder: 'Tất cả hệ thống',
      col: 5,
      allowClear: true,
      options: [
        { label: 'HRM', value: 'HRM' },
        { label: 'WMS', value: 'WMS' },
        { label: 'TMS', value: 'TMS' },
        { label: 'PMS', value: 'PMS' },
        { label: 'CMS', value: 'CMS' },
        { label: 'EAM', value: 'EAM' },
      ],
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
      key: 'status',
      label: 'Trạng thái',
      type: 'select',
      placeholder: 'Tất cả trạng thái',
      col: 6,
      allowClear: true,
      options: [
        { label: 'Thành công (Success)', value: 'Success' },
        { label: 'Đang thử lại (Retrying)', value: 'Retrying' },
        { label: 'Thất bại (Failed)', value: 'Failed' },
        { label: 'Hết lượt thử (DeadLetter)', value: 'DeadLetter' },
        { label: 'Đang xử lý (Processing)', value: 'Processing' },
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

  columns: TableColumn<SyncLog>[] = [
    {
      field: 'eventType',
      header: 'Sự kiện & Hệ thống',
      sortable: true,
      render: (v, row) => `[${row?.sourceSystem}] ${v}`,
    },
    {
      field: 'providerCode',
      header: 'Provider',
      type: 'tag',
      width: '150px',
      tagSeverity: () => 'primary',
    },
    {
      field: 'status',
      header: 'Trạng thái',
      type: 'tag',
      width: '130px',
      tagSeverity: (v) =>
        v === 'Success' ? 'success' : v === 'Retrying' ? 'warning' : v === 'Processing' ? 'info' : 'danger',
    },
    {
      field: 'retryCount',
      header: 'Lần thử',
      width: '90px',
      render: (v, row) => `${v}/${row?.maxRetries ?? 5}`,
    },
    {
      field: 'executionDurationMs',
      header: 'Thời lượng',
      width: '110px',
      render: (v) => `${v || 0} ms`,
    },
    {
      field: 'errorMessage',
      header: 'Chi tiết / Lỗi',
      render: (v) => v || 'Thành công',
    },
    {
      field: 'createdAt',
      header: 'Thời gian',
      type: 'datetime',
      width: '160px',
    },
  ];

  rowActions: RowAction<SyncLog>[] = [
    {
      key: 'detail',
      label: 'Xem Payload',
      icon: 'file-search',
      severity: 'primary',
      onClick: (record) => this.openPayloadDrawer(record),
    },
    {
      key: 'retry',
      label: 'Thử lại (Retry)',
      icon: 'redo',
      severity: 'warning',
      visible: (record) => record.status === 'Failed' || record.status === 'Retrying' || record.status === 'DeadLetter',
      onClick: (record) => this.retryLog(record),
    },
  ];

  // Drawer
  drawerVisible = false;
  selectedLog: SyncLog | null = null;

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
    if (this.filters['sourceSystem']) body['sourceSystem'] = this.filters['sourceSystem'];
    if (this.filters['providerCode']) body['providerCode'] = this.filters['providerCode'];
    if (this.filters['status']) body['status'] = this.filters['status'];

    this.hubService.getSyncLogs(body).subscribe({
      next: (res) => {
        this.data = res.items || [];
        this.pagination.total = res.totalCount || 0;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err?.error?.message || 'Không thể tải nhật ký đồng bộ.');
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
      sourceSystem: null,
      providerCode: null,
      status: null,
      dateRange: null,
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

  openPayloadDrawer(log: SyncLog): void {
    this.selectedLog = log;
    this.drawerVisible = true;
  }

  retryLog(log: SyncLog): void {
    this.hubService.retrySync(log.id).subscribe({
      next: (res) => {
        if (res.isSuccess) {
          this.message.success('Đã thử lại thành công!');
        } else {
          this.message.warning('Lệnh thử lại đã thực thi nhưng chưa thành công: ' + (res.errorMessage || 'Lỗi'));
        }
        this.loadData();
      },
      error: (err) => {
        this.message.error('Lỗi khi gửi lệnh thử lại: ' + (err?.error?.message || err.message));
      },
    });
  }

  getStatusTagColor(status: string): string {
    const map: Record<string, string> = {
      Success: 'green',
      Failed: 'red',
      DeadLetter: 'magenta',
      Retrying: 'orange',
      Processing: 'blue',
      Pending: 'gold',
    };
    return map[status] ?? 'default';
  }

  formatJson(json: string | null | undefined): string {
    if (!json) return '(không có)';
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  }
}
