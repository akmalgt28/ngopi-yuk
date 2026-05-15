export interface CoffeeType {
  id: string;
  name: string;
  base_coffee_grams: number;
  base_caffeine_mg: number;
  base_sugar_grams: number;
}

export interface CoffeeCatalog {
  coffee_types: CoffeeType[];
  size_modifiers: { [key: string]: number };
  sugar_modifiers: { [key: string]: number };
  extra_shot: {
    coffee_grams: number;
    caffeine_mg: number;
  };
}

export type CupSize = 'small' | 'medium' | 'large';
export type SugarLevel = 'normal' | 'less' | 'no_sugar';
export type Temperature = 'hot' | 'iced';

export interface CoffeeEntry {
  id: string;
  timestamp: string; // ISO date string
  date: string; // YYYY-MM-DD format for easy grouping
  coffeeTypeId: string;
  coffeeTypeName: string;
  temperature: Temperature;
  size: CupSize;
  sugarLevel: SugarLevel;
  extraShot: boolean;
  price: number;
  coffeeGrams: number;
  caffeineMg: number;
  sugarGrams: number;
  notes: string;
}

export interface DailySummary {
  date: string;
  totalCups: number;
  totalCaffeine: number;
  totalSugar: number;
  totalSpent: number;
  entries: CoffeeEntry[];
}

export interface PeriodSummary {
  label: string;
  totalCups: number;
  totalCaffeine: number;
  totalSugar: number;
  totalSpent: number;
  avgCupsPerDay: number;
  avgCaffeinePerDay: number;
}

export interface UserSettings {
  dailyCaffeineLimit: number; // mg
  dailySugarLimit: number; // grams
}

export interface AppData {
  entries: CoffeeEntry[];
  settings: UserSettings;
  customCoffeeTypes: CoffeeType[];
}
