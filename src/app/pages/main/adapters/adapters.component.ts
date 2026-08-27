import { enumData } from '@/app/core/constants/enums/enumData';
import { AdapterInfo, IntegrationHubService } from '@/app/core/services/integration-hub.service';
import {
  PaginationConfig,
  RowAction,
  TableColumn,
} from '@/app/shared/components/table-custom/table-custom.types';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AddOrUpdateAdapterModalComponent } from './add-or-update-adapter/add-or-update-adapter.component';

@Component({
  selector: 'app-adapters',
  standalone: false,
  templateUrl: './adapters.component.html',
  styleUrls: ['./adapters.component.scss'],
})
export class AdaptersComponent implements OnInit {
  loading = false;
  adapters: AdapterInfo[] = [];
  filteredAdapters: AdapterInfo[] = [];

  // Filter state
  searchTerm = '';
  selectedCategory: string | null = null;
  selectedStatus: boolean | null = null;

  // View mode
  viewMode: 'card' | 'table' = 'card';

  categories = [
    { label: 'Tất cả phân loại', value: null },
    { label: 'Nhắn tin & Thông báo (Messaging)', value: 'Messaging' },
    { label: 'Cổng thanh toán & QR (Payment)', value: 'Payment' },
    { label: 'Tin nhắn SMS (SMS)', value: 'SMS' },
    { label: 'Vận chuyển (Shipping)', value: 'Shipping' },
    { label: 'HTTP Webhook (Webhook)', value: 'Webhook' },
    { label: 'Tùy chỉnh khác (Custom)', value: 'Custom' },
  ];

  // Table config
  pagination: PaginationConfig = {
    current: enumData.PAGE.PAGE_INDEX,
    pageSize: enumData.PAGE.PAGE_SIZE,
    total: enumData.PAGE.TOTAL,
    showTotal: true,
  };

  columns: TableColumn[] = [
    { field: 'providerCode', header: 'Mã Provider', sortable: true, width: '150px' },
    { field: 'displayName', header: 'Tên hiển thị', sortable: true, width: '220px' },
    { field: 'category', header: 'Phân loại', sortable: true, width: '130px', type: 'tag' },
    { field: 'baseUrl', header: 'Base URL Endpoint', sortable: false, width: '260px' },
    { field: 'httpMethod', header: 'Method', sortable: false, width: '90px', type: 'tag' },
    { field: 'authType', header: 'Auth Type', sortable: false, width: '110px' },
    { field: 'isActive', header: 'Trạng thái', sortable: true, width: '120px', type: 'badge' },
    { field: 'createdAt', header: 'Ngày tạo', sortable: true, width: '150px', type: 'datetime' },
  ];

  rowActions: RowAction<AdapterInfo>[] = [
    {
      key: 'test',
      label: 'Playground',
      icon: 'thunderbolt',
      severity: 'info',
      onClick: (record) => this.goToPlayground(record),
    },
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
      onClick: (record) => this.deleteAdapter(record),
    },
  ];

  constructor(
    private hubService: IntegrationHubService,
    private modal: NzModalService,
    private message: NzMessageService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const query: any = {};
    if (this.searchTerm.trim()) query.search = this.searchTerm.trim();
    if (this.selectedCategory) query.category = this.selectedCategory;
    if (this.selectedStatus !== null) query.isActive = this.selectedStatus;

    this.hubService.getAdapters(query).subscribe({
      next: (res) => {
        this.adapters = res || [];
        this.filteredAdapters = [...this.adapters];
        this.pagination.total = this.filteredAdapters.length;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err?.error?.message || 'Không thể tải danh sách Adapter.');
        this.cdr.markForCheck();
      },
    });
  }

  applyFilter(): void {
    this.loadData();
  }

  resetFilter(): void {
    this.searchTerm = '';
    this.selectedCategory = null;
    this.selectedStatus = null;
    this.loadData();
  }

  openCreateModal(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Thêm Adapter Kết Nối Mới',
      nzContent: AddOrUpdateAdapterModalComponent,
      nzFooter: null,
      nzWidth: '780px',
    });

    modalRef.afterClose.subscribe((result) => {
      if (result !== false) {
        this.loadData();
      }
    });
  }

  openEditModal(adapter: AdapterInfo): void {
    const modalRef = this.modal.create({
      nzTitle: `Chỉnh sửa Adapter: ${adapter.displayName} (${adapter.providerCode})`,
      nzContent: AddOrUpdateAdapterModalComponent,
      nzData: { adapter },
      nzFooter: null,
      nzWidth: '780px',
    });

    modalRef.afterClose.subscribe((result) => {
      if (result !== false) {
        this.loadData();
      }
    });
  }

  toggleActive(adapter: AdapterInfo): void {
    if (!adapter.id) return;
    this.hubService.toggleAdapterStatus(adapter.id).subscribe({
      next: () => {
        adapter.isActive = !adapter.isActive;
        this.message.success(
          `Đã ${adapter.isActive ? 'kích hoạt' : 'tạm dừng'} Adapter ${adapter.displayName}`,
        );
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Không thể cập nhật trạng thái.');
      },
    });
  }

  deleteAdapter(adapter: AdapterInfo): void {
    if (!adapter.id) return;
    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xóa Adapter "${adapter.displayName}"?`,
      nzContent: `Mã Provider "${adapter.providerCode}" sẽ bị xóa vĩnh viễn khỏi danh mục. Các cấu hình Credentials liên quan cần được kiểm tra lại.`,
      nzOkDanger: true,
      nzOkText: 'Xác nhận xóa',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.hubService.deleteAdapter(adapter.id!).subscribe({
          next: () => {
            this.message.success('Đã xóa Adapter thành công!');
            this.loadData();
          },
          error: (err) => {
            this.message.error(err?.error?.message || 'Không thể xóa Adapter.');
          },
        });
      },
    });
  }

  goToPlayground(adapter: AdapterInfo): void {
    this.router.navigate(['/playground'], {
      queryParams: { provider: adapter.providerCode },
    });
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.pagination.current = event.page;
    this.pagination.pageSize = event.pageSize;
  }

  getCategoryColor(category: string): string {
    const map: Record<string, string> = {
      Messaging: 'blue',
      Payment: 'green',
      SMS: 'gold',
      Shipping: 'orange',
      Webhook: 'purple',
      Custom: 'cyan',
    };
    return map[category] || 'default';
  }
}
