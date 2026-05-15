import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Storage } from '@ionic/storage-angular';
import {
  CoffeeEntry, CoffeeType, CoffeeCatalog, CupSize, SugarLevel,
  DailySummary, PeriodSummary, UserSettings, AppData
} from '../models/coffee.model';

const ENTRIES_KEY = 'coffee_entries';
const SETTINGS_KEY = 'user_settings';
const CUSTOM_TYPES_KEY = 'custom_coffee_types';

@Injectable({
  providedIn: 'root'
})
export class CoffeeService {
  private _storage: Storage | null = null;
  private catalog: CoffeeCatalog | null = null;
  public dataChanged = new Subject<void>();

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    this._storage = await this.storage.create();
    await this.loadCatalog();
  }

  private async loadCatalog() {
    const response = await fetch('assets/data/coffee_catalog.json');
    this.catalog = await response.json();
  }

  getCatalog(): CoffeeCatalog | null {
    return this.catalog;
  }

  async getAllCoffeeTypes(): Promise<CoffeeType[]> {
    if (!this.catalog) await this.loadCatalog();
    const customTypes = await this.getCustomCoffeeTypes();
    return [...(this.catalog?.coffee_types || []), ...customTypes];
  }

  async getCustomCoffeeTypes(): Promise<CoffeeType[]> {
    await this.ensureStorage();
    return (await this._storage!.get(CUSTOM_TYPES_KEY)) || [];
  }

  async addCustomCoffeeType(coffeeType: CoffeeType): Promise<void> {
    const types = await this.getCustomCoffeeTypes();
    types.push(coffeeType);
    await this._storage!.set(CUSTOM_TYPES_KEY, types);
  }

  calculateNutrition(
    coffeeType: CoffeeType,
    size: CupSize,
    sugarLevel: SugarLevel,
    extraShot: boolean
  ): { coffeeGrams: number; caffeineMg: number; sugarGrams: number } {
    if (!this.catalog) {
      return { coffeeGrams: 0, caffeineMg: 0, sugarGrams: 0 };
    }

    const sizeModifier = this.catalog.size_modifiers[size] ?? 1;
    const sugarModifier = this.catalog.sugar_modifiers[sugarLevel] ?? 1;

    let coffeeGrams = Math.round(coffeeType.base_coffee_grams * sizeModifier);
    let caffeineMg = Math.round(coffeeType.base_caffeine_mg * sizeModifier);
    let sugarGrams = Math.round(coffeeType.base_sugar_grams * sizeModifier * sugarModifier);

    if (extraShot) {
      coffeeGrams += this.catalog.extra_shot.coffee_grams;
      caffeineMg += this.catalog.extra_shot.caffeine_mg;
    }

    return { coffeeGrams, caffeineMg, sugarGrams };
  }

  // CRUD Operations
  async addEntry(entry: CoffeeEntry): Promise<void> {
    const entries = await this.getAllEntries();
    entries.push(entry);
    await this._storage!.set(ENTRIES_KEY, entries);
    this.dataChanged.next();
  }

  async getAllEntries(): Promise<CoffeeEntry[]> {
    await this.ensureStorage();
    return (await this._storage!.get(ENTRIES_KEY)) || [];
  }

  async deleteEntry(id: string): Promise<void> {
    let entries = await this.getAllEntries();
    entries = entries.filter(e => e.id !== id);
    await this._storage!.set(ENTRIES_KEY, entries);
    this.dataChanged.next();
  }

  async getEntriesByDate(date: string): Promise<CoffeeEntry[]> {
    const entries = await this.getAllEntries();
    return entries.filter(e => e.date === date);
  }

  async getDailySummary(date: string): Promise<DailySummary> {
    const entries = await this.getEntriesByDate(date);
    return {
      date,
      totalCups: entries.length,
      totalCaffeine: entries.reduce((sum, e) => sum + e.caffeineMg, 0),
      totalSugar: entries.reduce((sum, e) => sum + e.sugarGrams, 0),
      totalSpent: entries.reduce((sum, e) => sum + e.price, 0),
      entries
    };
  }

  async getWeeklySummary(): Promise<PeriodSummary> {
    const entries = await this.getAllEntries();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEntries = entries.filter(e => new Date(e.timestamp) >= weekAgo);

    return {
      label: 'This Week',
      totalCups: weekEntries.length,
      totalCaffeine: weekEntries.reduce((sum, e) => sum + e.caffeineMg, 0),
      totalSugar: weekEntries.reduce((sum, e) => sum + e.sugarGrams, 0),
      totalSpent: weekEntries.reduce((sum, e) => sum + e.price, 0),
      avgCupsPerDay: Math.round((weekEntries.length / 7) * 10) / 10,
      avgCaffeinePerDay: Math.round((weekEntries.reduce((sum, e) => sum + e.caffeineMg, 0) / 7) * 10) / 10
    };
  }

  async getMonthlySummary(): Promise<PeriodSummary> {
    const entries = await this.getAllEntries();
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const daysInPeriod = Math.ceil((now.getTime() - monthAgo.getTime()) / (24 * 60 * 60 * 1000));
    const monthEntries = entries.filter(e => new Date(e.timestamp) >= monthAgo);

    return {
      label: 'This Month',
      totalCups: monthEntries.length,
      totalCaffeine: monthEntries.reduce((sum, e) => sum + e.caffeineMg, 0),
      totalSugar: monthEntries.reduce((sum, e) => sum + e.sugarGrams, 0),
      totalSpent: monthEntries.reduce((sum, e) => sum + e.price, 0),
      avgCupsPerDay: Math.round((monthEntries.length / daysInPeriod) * 10) / 10,
      avgCaffeinePerDay: Math.round((monthEntries.reduce((sum, e) => sum + e.caffeineMg, 0) / daysInPeriod) * 10) / 10
    };
  }

  async getDatesWithEntries(): Promise<Set<string>> {
    const entries = await this.getAllEntries();
    return new Set(entries.map(e => e.date));
  }

  async getChartData(days: number): Promise<{ labels: string[]; caffeine: number[]; sugar: number[]; spending: number[] }> {
    const entries = await this.getAllEntries();
    const now = new Date();
    const labels: string[] = [];
    const caffeine: number[] = [];
    const sugar: number[] = [];
    const spending: number[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const dayEntries = entries.filter(e => e.date === dateStr);
      labels.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
      caffeine.push(dayEntries.reduce((sum, e) => sum + e.caffeineMg, 0));
      sugar.push(dayEntries.reduce((sum, e) => sum + e.sugarGrams, 0));
      spending.push(dayEntries.reduce((sum, e) => sum + e.price, 0));
    }

    return { labels, caffeine, sugar, spending };
  }

  // Settings
  async getSettings(): Promise<UserSettings> {
    await this.ensureStorage();
    const settings = await this._storage!.get(SETTINGS_KEY);
    return settings || { dailyCaffeineLimit: 400, dailySugarLimit: 50 };
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    await this._storage!.set(SETTINGS_KEY, settings);
  }

  // Export/Import
  async exportData(): Promise<AppData> {
    const entries = await this.getAllEntries();
    const settings = await this.getSettings();
    const customCoffeeTypes = await this.getCustomCoffeeTypes();
    return { entries, settings, customCoffeeTypes };
  }

  async importData(data: AppData): Promise<void> {
    await this._storage!.set(ENTRIES_KEY, data.entries || []);
    await this._storage!.set(SETTINGS_KEY, data.settings || { dailyCaffeineLimit: 400, dailySugarLimit: 50 });
    await this._storage!.set(CUSTOM_TYPES_KEY, data.customCoffeeTypes || []);
    this.dataChanged.next();
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private async ensureStorage() {
    if (!this._storage) {
      this._storage = await this.storage.create();
    }
  }
}
