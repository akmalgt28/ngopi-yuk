import { Injectable } from '@angular/core';
import { CoffeeService } from './coffee.service';

@Injectable({
  providedIn: 'root'
})
export class StreakService {

  constructor(private coffeeService: CoffeeService) {}

  async getCurrentStreak(): Promise<number> {
    const entries = await this.coffeeService.getAllEntries();
    if (entries.length === 0) return 0;

    const datesWithEntries = new Set(entries.map(e => e.date));
    const sortedDates = Array.from(datesWithEntries).sort().reverse();

    if (sortedDates.length === 0) return 0;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    let currentDate = new Date(sortedDates[0]);

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
      const prevDateStr = prevDate.toISOString().split('T')[0];

      if (sortedDates[i] === prevDateStr) {
        streak++;
        currentDate = prevDate;
      } else {
        break;
      }
    }

    return streak;
  }

  async hasEntryToday(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const entries = await this.coffeeService.getEntriesByDate(today);
    return entries.length > 0;
  }

  async getLongestStreak(): Promise<number> {
    const entries = await this.coffeeService.getAllEntries();
    if (entries.length === 0) return 0;

    const datesWithEntries = Array.from(new Set(entries.map(e => e.date))).sort();
    if (datesWithEntries.length === 0) return 0;

    let longestStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < datesWithEntries.length; i++) {
      const prevDate = new Date(datesWithEntries[i - 1]);
      const currDate = new Date(datesWithEntries[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));

      if (diffDays === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    return longestStreak;
  }
}
