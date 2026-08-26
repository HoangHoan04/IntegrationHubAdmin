import { Component, OnInit } from '@angular/core';
import { IntegrationHubService, DashboardStats } from '@/app/core/services/integration-hub.service';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'app-hub-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  loading = false;
  stats: DashboardStats | null = null;

  trendChartOption: EChartsOption = {};
  providerChartOption: EChartsOption = {};
  sourceChartOption: EChartsOption = {};

  constructor(private hubService: IntegrationHubService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.hubService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.initCharts(res);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private initCharts(stats: DashboardStats): void {
    // 1. Trend Chart
    const dates = stats.dailyTrend.map(d => d.date);
    const successData = stats.dailyTrend.map(d => d.successCount);
    const failedData = stats.dailyTrend.map(d => d.failedCount);

    this.trendChartOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Thành công', 'Thất bại'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: dates },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Thành công',
          type: 'line',
          smooth: true,
          data: successData,
          itemStyle: { color: '#52c41a' },
          areaStyle: { color: 'rgba(82, 196, 26, 0.15)' }
        },
        {
          name: 'Thất bại',
          type: 'line',
          smooth: true,
          data: failedData,
          itemStyle: { color: '#ff4d4f' },
          areaStyle: { color: 'rgba(255, 77, 79, 0.15)' }
        }
      ]
    };

    // 2. Provider Distribution (Doughnut)
    this.providerChartOption = {
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', left: 'center' },
      series: [
        {
          name: 'Provider',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' }
          },
          data: stats.eventsByProvider.map(p => ({ value: p.value, name: p.name }))
        }
      ]
    };

    // 3. Source System Distribution (Bar)
    this.sourceChartOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: stats.eventsBySourceSystem.map(s => s.name) },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Số sự kiện',
          type: 'bar',
          barWidth: '40%',
          data: stats.eventsBySourceSystem.map(s => s.value),
          itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] }
        }
      ]
    };
  }
}
