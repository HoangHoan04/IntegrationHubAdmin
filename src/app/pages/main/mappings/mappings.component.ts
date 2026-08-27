import { enumData } from '@/app/core/constants/enums/enumData';
import {
  IntegrationHubService,
  IntegrationMapping,
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
import { AddOrUpdateMappingModalComponent } from './add-or-update-mapping/add-or-update-mapping.component';

@Component({
  selector: 'app-mappings-manager',
  standalone: false,
  templateUrl: './mappings.component.html',
  styleUrls: ['./mappings.component.scss'],
})
export class MappingsComponent implements OnInit {
  data: IntegrationMapping[] = [];
  loading = false;

  pagination: PaginationConfig = {
    current: enumData.PAGE.PAGE_INDEX,
    pageSize: enumData.PAGE.PAGE_SIZE,
    total: enumData.PAGE.TOTAL,
    showTotal: true,
  };

  filters: Record<string, any> = {
    search: '',
    sourceSystem: null,
    providerCode: null,
    isActive: null,
  };

  filterConfig: FilterConfig = {
    show: true,
    collapsible: true,
    defaultOpen: true,
    title: 'Bộ lọc tìm kiếm Event Mappings',
    actionsAlign: 'center',
  };

  filterFields: FilterField[] = [
    {
      key: 'search',
      label: 'Tìm kiếm',
      type: 'input',
      placeholder: 'Tên cấu hình hoặc loại sự kiện...',
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
        { label: 'HRM (Nhân sự)', value: 'HRM' },
        { label: 'WMS (Kho bãi)', value: 'WMS' },
        { label: 'TMS (Vận tải)', value: 'TMS' },
        { label: 'PMS (Sản xuất)', value: 'PMS' },
        { label: 'CMS (Khách hàng)', value: 'CMS' },
        { label: 'EAM (Thiết bị)', value: 'EAM' },
        { label: 'AUTH (Xác thực)', value: 'AUTH' },
      ],
    },
    {
      key: 'providerCode',
      label: 'Adapter Provider',
      type: 'select',
      placeholder: 'Tất cả adapters',
      col: 5,
      allowClear: true,
      options: [
        { label: 'Zalo Official Account (ZNS)', value: 'ZALO_OA' },
        { label: 'VNPay Payment', value: 'VNPAY' },
        { label: 'MoMo Payment', value: 'MOMO' },
        { label: 'VietQR Dynamic QR', value: 'VIETQR' },
        { label: 'Telegram Bot Alert', value: 'TELEGRAM' },
        { label: 'Custom HTTP Webhook', value: 'CUSTOM_WEBHOOK' },
      ],
    },
    {
      key: 'isActive',
      label: 'Trạng thái',
      type: 'select',
      placeholder: 'Tất cả trạng thái',
      col: 6,
      allowClear: true,
      options: [
        { label: 'Đang hoạt động', value: true },
        { label: 'Tạm dừng', value: false },
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
      label: 'Tạo mới Event Mapping',
    },
  ];

  columns: TableColumn<IntegrationMapping>[] = [
    {
      field: 'name',
      header: 'Tên cấu hình Mapping',
      sortable: true,
      render: (v, row) => `${v}${row?.description ? ' - ' + row.description : ''}`,
    },
    {
      field: 'sourceSystem',
      header: 'Hệ thống nguồn',
      type: 'tag',
      width: '140px',
      tagSeverity: () => 'info',
    },
    {
      field: 'eventType',
      header: 'Sự kiện (Event Type)',
      width: '200px',
      render: (v) => v || '*',
    },
    {
      field: 'providerCode',
      header: 'Adapter Provider',
      type: 'tag',
      width: '160px',
      tagSeverity: () => 'primary',
    },
    {
      field: 'isActive',
      header: 'Trạng thái',
      type: 'badge',
      width: '130px',
      badgeSeverity: (v) => (v ? 'success' : 'danger'),
      render: (v) => (v ? 'Hoạt động' : 'Tạm dừng'),
    },
    {
      field: 'createdAt',
      header: 'Ngày tạo',
      type: 'datetime',
      width: '160px',
    },
  ];

  rowActions: RowAction<IntegrationMapping>[] = [
    {
      key: 'edit',
      label: 'Chỉnh sửa',
      icon: 'edit',
      severity: 'primary',
      onClick: (record) => this.openEditModal(record),
    },
    {
      key: 'toggle',
      label: 'Bật/Tắt',
      icon: 'sync',
      severity: 'warning',
      onClick: (record) => this.toggleActive(record),
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
    if (this.filters['sourceSystem']) body['sourceSystem'] = this.filters['sourceSystem'];
    if (this.filters['providerCode']) body['providerCode'] = this.filters['providerCode'];
    if (this.filters['isActive'] !== null && this.filters['isActive'] !== undefined) {
      body['isActive'] = this.filters['isActive'];
    }

    this.hubService.getMappings(body).subscribe({
      next: (res) => {
        this.data = res.items || [];
        this.pagination.total = res.totalCount || 0;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err?.error?.message || 'Không thể tải danh sách event mappings.');
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
      isActive: null,
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
      nzTitle: 'Tạo mới Cấu hình Event Mapping',
      nzContent: AddOrUpdateMappingModalComponent,
      nzWidth: '680px',
      nzFooter: null,
    });

    modalRef.afterClose.subscribe((result) => {
      if (result) this.loadData();
    });
  }

  openEditModal(item: IntegrationMapping): void {
    const modalRef = this.modal.create({
      nzTitle: 'Chỉnh sửa Cấu hình Event Mapping',
      nzContent: AddOrUpdateMappingModalComponent,
      nzData: { mapping: item },
      nzWidth: '680px',
      nzFooter: null,
    });

    modalRef.afterClose.subscribe((result) => {
      if (result) this.loadData();
    });
  }

  toggleActive(item: IntegrationMapping): void {
    this.hubService.toggleMappingActive(item.id).subscribe({
      next: (res) => {
        item.isActive = res.isActive;
        this.message.success(`Đã ${res.isActive ? 'kích hoạt' : 'tạm dừng'} mapping thành công.`);
      },
      error: (err) => {
        this.message.error('Lỗi khi đổi trạng thái: ' + (err?.error?.message || err.message));
      },
    });
  }

  deleteItem(item: IntegrationMapping): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa mapping?',
      nzContent: `Bạn có chắc chắn muốn xóa mapping "${item.name}"?`,
      nzOkDanger: true,
      nzOnOk: () => {
        this.hubService.deleteMapping(item.id).subscribe({
          next: () => {
            this.message.success('Đã xóa mapping thành công.');
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
