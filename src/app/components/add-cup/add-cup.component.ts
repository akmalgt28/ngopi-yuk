import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonButtons, IonIcon, IonToggle,
  IonSegment, IonSegmentButton, IonLabel, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, cafe, saveOutline, calendarOutline, cafeOutline,
  thermometerOutline, flame, snow, resizeOutline,
  colorPaletteOutline, cashOutline, statsChartOutline,
  documentTextOutline
} from 'ionicons/icons';
import { CoffeeService } from '../../services/coffee.service';
import { CoffeeType, CoffeeEntry, CupSize, SugarLevel, Temperature } from '../../models/coffee.model';

@Component({
  selector: 'app-add-cup',
  templateUrl: './add-cup.component.html',
  styleUrls: ['./add-cup.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonToggle,
    IonSegment, IonSegmentButton, IonLabel
  ],
})
export class AddCupComponent implements OnInit {

  coffeeForm!: FormGroup;
  coffeeTypes: CoffeeType[] = [];
  selectedCoffeeType: CoffeeType | null = null;

  calcCoffeeGrams = 0;
  calcCaffeineMg = 0;
  calcSugarGrams = 0;

  constructor(
    private fb: FormBuilder,
    private coffeeService: CoffeeService,
    private navCtrl: NavController
  ) {
    addIcons({
      close, cafe, saveOutline, calendarOutline, cafeOutline,
      thermometerOutline, flame, snow, resizeOutline,
      colorPaletteOutline, cashOutline, statsChartOutline,
      documentTextOutline
    });
  }

  async ngOnInit() {
    this.coffeeTypes = await this.coffeeService.getAllCoffeeTypes();

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);

    this.coffeeForm = this.fb.group({
      date: [dateStr],
      time: [timeStr],
      coffeeTypeId: [''],
      temperature: ['hot' as Temperature],
      size: ['medium' as CupSize],
      sugarLevel: ['normal' as SugarLevel],
      extraShot: [false],
      price: [0],
      notes: [''],
      coffeeGrams: [0],
      caffeineMg: [0],
      sugarGrams: [0]
    });

    this.coffeeForm.get('coffeeTypeId')?.valueChanges.subscribe(() => this.recalculate());
    this.coffeeForm.get('size')?.valueChanges.subscribe(() => this.recalculate());
    this.coffeeForm.get('sugarLevel')?.valueChanges.subscribe(() => this.recalculate());
    this.coffeeForm.get('extraShot')?.valueChanges.subscribe(() => this.recalculate());
  }

  recalculate() {
    const coffeeTypeId = this.coffeeForm.get('coffeeTypeId')?.value;
    this.selectedCoffeeType = this.coffeeTypes.find(t => t.id === coffeeTypeId) || null;

    if (!this.selectedCoffeeType) return;

    const size = this.coffeeForm.get('size')?.value as CupSize;
    const sugarLevel = this.coffeeForm.get('sugarLevel')?.value as SugarLevel;
    const extraShot = this.coffeeForm.get('extraShot')?.value;

    const result = this.coffeeService.calculateNutrition(
      this.selectedCoffeeType, size, sugarLevel, extraShot
    );

    this.calcCoffeeGrams = result.coffeeGrams;
    this.calcCaffeineMg = result.caffeineMg;
    this.calcSugarGrams = result.sugarGrams;

    this.coffeeForm.patchValue({
      coffeeGrams: result.coffeeGrams,
      caffeineMg: result.caffeineMg,
      sugarGrams: result.sugarGrams
    }, { emitEvent: false });
  }

  async onSubmit() {
    if (!this.selectedCoffeeType) return;

    const formVal = this.coffeeForm.value;
    const timestamp = new Date(`${formVal.date}T${formVal.time}`).toISOString();

    const entry: CoffeeEntry = {
      id: this.coffeeService.generateId(),
      timestamp,
      date: formVal.date,
      coffeeTypeId: formVal.coffeeTypeId,
      coffeeTypeName: this.selectedCoffeeType.name,
      temperature: formVal.temperature,
      size: formVal.size,
      sugarLevel: formVal.sugarLevel,
      extraShot: formVal.extraShot,
      price: Number(formVal.price) || 0,
      coffeeGrams: Number(formVal.coffeeGrams),
      caffeineMg: Number(formVal.caffeineMg),
      sugarGrams: Number(formVal.sugarGrams),
      notes: formVal.notes || ''
    };

    await this.coffeeService.addEntry(entry);
    this.navCtrl.back();
  }

  onClose() {
    this.navCtrl.back();
  }
}
