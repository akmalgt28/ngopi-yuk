import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldCheckmarkOutline } from 'ionicons/icons';
import { Storage } from '@ionic/storage-angular';

const DISCLAIMER_KEY = 'disclaimer_accepted';

@Component({
  selector: 'app-disclaimer',
  templateUrl: './disclaimer.component.html',
  styleUrls: ['./disclaimer.component.scss'],
  imports: [CommonModule, IonButton, IonIcon],
})
export class DisclaimerComponent implements OnInit {
  isVisible = false;
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    addIcons({ shieldCheckmarkOutline });
  }

  async ngOnInit() {
    this._storage = await this.storage.create();
    const accepted = await this._storage.get(DISCLAIMER_KEY);
    if (!accepted) {
      this.isVisible = true;
    }
  }

  async accept() {
    if (this._storage) {
      await this._storage.set(DISCLAIMER_KEY, true);
    }
    this.isVisible = false;
  }
}
