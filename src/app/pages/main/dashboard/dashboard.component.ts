import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { IntegrationHubService, DashboardStats } from '../../../core/services/integration-hub.service';

@Component({
  selector: 'app-hub-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  loading = false;
  stats: DashboardStats | null = null;
  autoRefresh = true;

  trendChartOption: any = null;
  providerChartOption: any = null;
  sourceChartOption: any = null;

  hasTrendData = false;
  hasProviderData = false;
  hasSourceData = false;

  private pollSubscription?: Subscription;

  constructor(
    private readonly hubService: IntegrationHubService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.pollSubscription = interval(15000).subscribe(() => {
      if (this.autoRefresh) {
        this.loadStats();
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  loadStats(): void {
    this.loading = true;
    this.hubService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.initCharts(res);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private initCharts(stats: DashboardStats): void {
    // 1. Trend Chart (7 days)
    const trend = stats.dailyTrend || [];
    const dates = trend.map((d) => d.date);
    const successData = trend.map((d) => d.successCount);
    const failedData = trend.map((d) => d.failedCount);
    this.hasTrendData = trend.some((d) => d.totalCount > 0);

    this.trendChartOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 12 },
      },
      legend: {
        data: ['Thành công', 'Thất bại'],
        top: 0,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      grid: { left: '2%', right: '4%', bottom: '3%', top: '16%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates.length ? dates : ['Hôm nay'],
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      series: [
        {
          name: 'Thành công',
          type: 'line',
          smooth: true,
          data: successData,
          itemStyle: { color: '#10b981' },
          lineStyle: { width: 3, color: '#10b981' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
              ],
            },
          },
        },
        {
          name: 'Thất bại',
          type: 'line',
          smooth: true,
          data: failedData,
          itemStyle: { color: '#ef4444' },
          lineStyle: { width: 2.5, color: '#ef4444' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.02)' },
              ],
            },
          },
        },
      ],
    };

    // 2. Provider Distribution (Doughnut)
    const providers = stats.eventsByProvider || [];
    this.hasProviderData = providers.some((p) => p.value > 0);
    const providerColors = ['#2563eb', '#10b981', '#f59e0b', '#7c3aed', '#06b6d4', '#ec4899'];

    this.providerChartOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} sự kiện ({d}%)',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 12 },
      },
      legend: {
        bottom: '0%',
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#64748b', fontSize: 11 },
      },
      series: [
        {
          name: 'Đối tác',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 13, fontWeight: 'bold' },
          },
          data: providers.map((p, idx) => ({
            value: p.value,
            name: p.name,
            itemStyle: { color: providerColors[idx % providerColors.length] },
          })),
        },
      ],
    };

    // 3. Source System Distribution (Bar)
    const sources = stats.eventsBySourceSystem || [];
    this.hasSourceData = sources.some((s) => s.value > 0);

    this.sourceChartOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        borderColor: '#334155',
        textStyle: { color: '#f8fafc', fontSize: 12 },
      },
      grid: { left: '2%', right: '4%', bottom: '3%', top: '16%', containLabel: true },
      xAxis: {
        type: 'category',
        data: sources.map((s) => s.name),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      series: [
        {
          name: 'Số sự kiện',
          type: 'bar',
          barMaxWidth: 30,
          data: sources.map((s) => s.value),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#2563eb' },
                { offset: 1, color: '#3b82f6' },
              ],
            },
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
    };
  }
}
