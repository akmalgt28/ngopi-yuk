import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonSegment, IonSegmentButton, IonLabel,
  IonIcon, IonList, IonItem, IonItemSliding, IonItemOptions,
  IonItemOption, IonBadge,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cafe, flash, water, cashOutline, trendingUp, calendar, calendarOutline,
  trashOutline, statsChart, documentText, flame, snow
} from 'ionicons/icons';
import { Chart, registerables } from 'chart.js';
import { CoffeeService } from '../services/coffee.service';
import { PeriodSummary, CoffeeEntry } from '../models/coffee.model';
import { Subscription } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonSegment, IonSegmentButton, IonLabel,
    IonIcon, IonList, IonItem, IonItemSliding, IonItemOptions,
    IonItemOption, IonBadge,
    IonSelect, IonSelectOption
  ],
})
export class Tab2Page implements OnInit, OnDestroy {
  weeklySummary: PeriodSummary = { label: '', totalCups: 0, totalCaffeine: 0, totalSugar: 0, totalSpent: 0, avgCupsPerDay: 0, avgCaffeinePerDay: 0 };
  monthlySummary: PeriodSummary = { label: '', totalCups: 0, totalCaffeine: 0, totalSugar: 0, totalSpent: 0, avgCupsPerDay: 0, avgCaffeinePerDay: 0 };

  chartView: 'caffeine' | 'sugar' | 'spending' = 'caffeine';
  chartDays = 7;
  allEntries: CoffeeEntry[] = [];
  filteredEntries: CoffeeEntry[] = [];
  availableMonths: string[] = [];
  selectedMonth = '';

  private chart: Chart | null = null;
  private dataSub!: Subscription;

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private coffeeService: CoffeeService) {
    addIcons({ cafe, flash, water, cashOutline, trendingUp, calendar, calendarOutline, trashOutline, statsChart, documentText, flame, snow });
  }

  async ngOnInit() {
    await this.loadData();
    this.dataSub = this.coffeeService.dataChanged.subscribe(() => {
      this.loadData();
    });
  }

  ngOnDestroy() {
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
  }

  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData() {
    this.weeklySummary = await this.coffeeService.getWeeklySummary();
    this.monthlySummary = await this.coffeeService.getMonthlySummary();
    this.allEntries = (await this.coffeeService.getAllEntries()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Generate month filter
    const months = new Set(this.allEntries.map(e => e.date.substring(0, 7)));
    this.availableMonths = Array.from(months).sort().reverse();
    this.selectedMonth = this.availableMonths[0] || '';
    this.filterEntries();

    setTimeout(() => this.renderChart(), 300);
  }

  filterEntries() {
    if (this.selectedMonth) {
      this.filteredEntries = this.allEntries.filter(e => e.date.startsWith(this.selectedMonth));
    } else {
      this.filteredEntries = this.allEntries;
    }
  }

  onMonthChange(event: any) {
    this.selectedMonth = event.detail.value;
    this.filterEntries();
  }

  onChartViewChange(event: any) {
    this.chartView = event.detail.value;
    this.renderChart();
  }

  onChartDaysChange(event: any) {
    this.chartDays = event.detail.value;
    this.renderChart();
  }

  async renderChart() {
    if (!this.chartCanvas) return;

    const data = await this.coffeeService.getChartData(this.chartDays);

    if (this.chart) {
      this.chart.destroy();
    }

    const colors: Record<string, { bg: string; border: string }> = {
      caffeine: { bg: 'rgba(255, 171, 64, 0.3)', border: '#ffab40' },
      sugar: { bg: 'rgba(126, 87, 194, 0.3)', border: '#b388ff' },
      spending: { bg: 'rgba(38, 166, 154, 0.3)', border: '#80cbc4' }
    };

    const labels: Record<string, string> = {
      caffeine: 'Kafein (mg)',
      sugar: 'Gula (g)',
      spending: 'Pengeluaran (Rp)'
    };

    const chartData = this.chartView === 'caffeine' ? data.caffeine :
                       this.chartView === 'sugar' ? data.sugar : data.spending;

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: labels[this.chartView],
          data: chartData,
          backgroundColor: colors[this.chartView].bg,
          borderColor: colors[this.chartView].border,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#8d6e63',
              font: { family: 'Outfit', size: 10 },
              maxRotation: 45
            }
          },
          y: {
            grid: { color: 'rgba(141, 110, 99, 0.1)' },
            ticks: {
              color: '#8d6e63',
              font: { family: 'Outfit', size: 10 }
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  async deleteEntry(id: string) {
    await this.coffeeService.deleteEntry(id);
    await this.loadData();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
