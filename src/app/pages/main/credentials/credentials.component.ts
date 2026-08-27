import { enumData } from '@/app/core/constants/enums/enumData';
import {
  IntegrationCredential,
  IntegrationHubService,
} from '@/app/core/services/integration-hub.service';
import {
  CommonFilterActions,
  FilterAction,
  FilterConfig,
  FilterField,
} from '@/app/shared/components/filter-custom/filter-custom.types';
import {
  CommonActions,
  PaginationConfig,
  RowAction,
  TableAction,
  TableColumn,
  ToolbarConfig,
} from '@/app/shared/components/table-custom/table-custom.types';
import { Component, OnInit } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AddOrUpdateCredentialModalComponent } from './add-or-update-credential/add-or-update-credential.component';

@Component({
  selector: 'app-credentials-manager',
  standalone: false,
  templateUrl: './credentials.component.html',
  styleUrls: ['./credentials.component.scss'],
})
export class CredentialsComponent implements OnInit {
  data: IntegrationCredential[] = [];
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
    environment: null,
  };

  filterConfig: FilterConfig = {
    show: true,
    collapsible: true,
    defaultOpen: true,
    title: 'Bộ lọc tìm kiếm Cấu hình Xác thực (Credentials)',
    actionsAlign: 'center',
  };

  filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'Tìm kiếm',
      type: 'input',
      placeholder: 'Tên cấu hình hoặc công ty...',
      col: 8,
      allowClear: true,
    },
    {
      key: 'providerCode',
      label: 'Adapter Provider',
      type: 'select',
      placeholder: 'Tất cả adapters',
      col: 8,
      allowClear: true,
      options: [
        { label: 'Zalo Official Account', value: 'ZALO_OA' },
        { label: 'VNPay Payment', value: 'VNPAY' },
        { label: 'MoMo Payment', value: 'MOMO' },
        { label: 'VietQR Dynamic QR', value: 'VIETQR' },
        { label: 'Telegram Bot', value: 'TELEGRAM' },
        { label: 'Custom Webhook', value: 'CUSTOM_WEBHOOK' },
      ],
    },
    {
      key: 'environment',
      label: 'Môi trường',
      type: 'select',
      placeholder: 'Tất cả môi trường',
      col: 8,
      allowClear: true,
      options: [
        { label: 'Production', value: 'Production' },
        { label: 'Sandbox / Test', value: 'Sandbox' },
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

  toolbarActions: TableAction[] = [
    {
      ...CommonActions.create(() => this.openCreateModal()),
      label: 'Thêm mới Credentials',
    },
  ];

  columns: TableColumn<IntegrationCredential>[] = [
    {
      field: 'name',
      header: 'Tên cấu hình',
      sortable: true,
      render: (v, row) =>
        `${v}${row?.companyName ? ' (' + row.companyName + ')' : ' (Toàn hệ thống)'}`,
    },
    {
      field: 'providerCode',
      header: 'Provider',
      type: 'tag',
      width: '150px',
      tagSeverity: () => 'primary',
    },
    {
      field: 'environment',
      header: 'Môi trường',
      type: 'tag',
      width: '130px',
      tagSeverity: (v) => (v === 'Production' ? 'danger' : 'warning'),
    },
    {
      field: 'maskedFields',
      header: 'Thông tin bảo mật đã mã hóa',
      render: (v) => {
        if (!v || Object.keys(v).length === 0) return 'Chưa cấu hình';
        return Object.entries(v)
          .map(([k, val]) => `${k}: ${val}`)
          .join(' | ');
      },
    },
    {
      field: 'createdAt',
      header: 'Ngày tạo',
      type: 'datetime',
      width: '160px',
    },
  ];

  rowActions: RowAction<IntegrationCredential>[] = [
    {
      key: 'edit',
      label: 'Chỉnh sửa',
      icon: 'edit',
      severity: 'primary',
      onClick: (record) => this.openEditModal(record),
    },
    {
      key: 'delete',
      label: 'Xóa',
      icon: 'delete',
      severity: 'danger',
      onClick: (record) => this.deleteItem(record),
    },
  ];

  constructor(
    private readonly hubService: IntegrationHubService,
    private readonly message: NzMessageService,
    private readonly modal: NzModalService,
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
    if (this.filters['environment']) body['environment'] = this.filters['environment'];

    this.hubService.getCredentials(body).subscribe({
      next: (res) => {
        this.data = res.items || [];
        this.pagination.total = res.totalCount || 0;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err?.error?.message || 'Không thể tải danh sách credentials.');
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
      environment: null,
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

  openCreateModal(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Thêm Cấu hình Xác thực (Credential)',
      nzContent: AddOrUpdateCredentialModalComponent,
      nzWidth: '680px',
      nzFooter: null,
    });

    modalRef.afterClose.subscribe((res) => {
      if (res) this.loadData();
    });
  }

  openEditModal(item: IntegrationCredential): void {
    const modalRef = this.modal.create({
      nzTitle: 'Chỉnh sửa Cấu hình Xác thực',
      nzContent: AddOrUpdateCredentialModalComponent,
      nzData: { credential: item },
      nzWidth: '680px',
      nzFooter: null,
    });

    modalRef.afterClose.subscribe((res) => {
      if (res) this.loadData();
    });
  }

  deleteItem(item: IntegrationCredential): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa credential?',
      nzContent: `Bạn có chắc chắn muốn xóa cấu hình "${item.name}" của provider ${item.providerCode}?`,
      nzOkDanger: true,
      nzOnOk: () => {
        this.hubService.deleteCredential(item.id).subscribe({
          next: () => {
            this.message.success('Đã xóa cấu hình xác thực thành công.');
            this.loadData();
          },
          error: (err) => {
            this.message.error('Lỗi khi xóa: ' + (err?.error?.message || err.message));
          },
        });
      },
    });
  }
}
