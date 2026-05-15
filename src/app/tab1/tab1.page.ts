import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonFab, IonFabButton, IonIcon,
  IonChip, IonLabel, IonButton,
  IonProgressBar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add, flame, cafe, flash, water, cashOutline, chevronBack,
  chevronForward, todayOutline, snow, wallet,
} from 'ionicons/icons';
import { CoffeeService } from '../services/coffee.service';
import { StreakService } from '../services/streak.service';
import { DailySummary, UserSettings } from '../models/coffee.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonFab, IonFabButton, IonIcon,
    IonChip, IonLabel, IonButton,
    IonProgressBar
  ],
})
export class Tab1Page implements OnInit {
  streak = 0;
  hasEntryToday = false;
  
  todaySummary: DailySummary = {
    date: '', totalCups: 0, totalCaffeine: 0, totalSugar: 0, totalSpent: 0, entries: []
  };
  settings: UserSettings = { dailyCaffeineLimit: 400, dailySugarLimit: 50 };

  // Calendar
  currentMonth = new Date();
  calendarDays: { date: number; dateStr: string; hasEntry: boolean; isToday: boolean; isEmpty: boolean }[] = [];
  datesWithEntries = new Set<string>();
  weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  constructor(
    private coffeeService: CoffeeService,
    private streakService: StreakService,
    private router: Router
  ) {
    addIcons({ add, flame, cafe, flash, water, cashOutline, chevronBack, chevronForward, todayOutline, snow, wallet });
  }

  private dataSub!: Subscription;

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
    const today = new Date().toISOString().split('T')[0];
    this.streak = await this.streakService.getCurrentStreak();
    this.hasEntryToday = await this.streakService.hasEntryToday();
    this.todaySummary = await this.coffeeService.getDailySummary(today);
    this.settings = await this.coffeeService.getSettings();
    this.datesWithEntries = await this.coffeeService.getDatesWithEntries();
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date().toISOString().split('T')[0];

    this.calendarDays = [];

    // Get the day of the week (Monday = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      this.calendarDays.push({ date: 0, dateStr: '', hasEntry: false, isToday: false, isEmpty: true });
    }

    // Days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      this.calendarDays.push({
        date: d,
        dateStr,
        hasEntry: this.datesWithEntries.has(dateStr),
        isToday: dateStr === today,
        isEmpty: false
      });
    }
  }

  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  get formatDate(): (dateStr: string) => string {
    return (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  get monthLabel(): string {
    return this.currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }

  get caffeinePercentage(): number {
    return Math.min((this.todaySummary.totalCaffeine / this.settings.dailyCaffeineLimit) * 100, 100) / 100;
  }

  get sugarPercentage(): number {
    return Math.min((this.todaySummary.totalSugar / this.settings.dailySugarLimit) * 100, 100) / 100;
  }

  get isCaffeineWarning(): boolean {
    return this.todaySummary.totalCaffeine >= this.settings.dailyCaffeineLimit * 0.8;
  }

  get isSugarWarning(): boolean {
    return this.todaySummary.totalSugar >= this.settings.dailySugarLimit * 0.8;
  }

  openAddCup() {
    this.router.navigate(['/add-cup']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }
}
