import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonInput, IonButton, IonIcon,
  AlertController, ToastController, IonLabel, IonItemDivider,
  ActionSheetController // TAMBAHAN: Import ActionSheet
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  downloadOutline, cloudUploadOutline, informationCircleOutline,
  saveOutline, shield, alertCircleOutline, cafeOutline,
  documentTextOutline, openOutline, settingsOutline,
  flashOutline, waterOutline, lockClosedOutline
} from 'ionicons/icons';
import { CoffeeService } from '../services/coffee.service';
import { UserSettings, AppData } from '../models/coffee.model';
import { Subscription } from 'rxjs';

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  imports: [IonItemDivider, IonLabel, 
    CommonModule, FormsModule,
    IonContent,
    IonInput, IonButton, IonIcon
  ],
})
export class Tab3Page implements OnInit, OnDestroy {
  settings: UserSettings = { dailyCaffeineLimit: 400, dailySugarLimit: 50 };
  appVersion = 'ny-1.0.1';
  private dataSub!: Subscription;

  constructor(
    private coffeeService: CoffeeService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController
  ) {
    addIcons({
      downloadOutline, cloudUploadOutline, informationCircleOutline,
      saveOutline, shield, alertCircleOutline, cafeOutline,
      documentTextOutline, openOutline, settingsOutline,
      flashOutline, waterOutline, lockClosedOutline
    });
  }

  async ngOnInit() {
    this.settings = await this.coffeeService.getSettings();
    this.dataSub = this.coffeeService.dataChanged.subscribe(async () => {
      this.settings = await this.coffeeService.getSettings();
    });
  }

  ngOnDestroy() {
    if (this.dataSub) {
      this.dataSub.unsubscribe();
    }
  }

  async ionViewWillEnter() {
    this.settings = await this.coffeeService.getSettings();
  }

  async saveSettings() {
    await this.coffeeService.saveSettings(this.settings);
    const toast = await this.toastCtrl.create({
      message: 'Pengaturan tersimpan!',
      duration: 2000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
  }

  async exportData() {
    try {
      const data = await this.coffeeService.exportData();
      const json = JSON.stringify(data, null, 2);
      const fileName = `ngopi-yuk-backup-${new Date().toISOString().split('T')[0]}.json`;

      if (Capacitor.isNativePlatform()) {
        let permStatus = await Filesystem.checkPermissions();
        if (permStatus.publicStorage !== 'granted') {
          permStatus = await Filesystem.requestPermissions();
        }

        if (permStatus.publicStorage !== 'granted') {
          throw new Error('Izin penyimpanan ditolak.');
        }

        await Filesystem.writeFile({
          path: `NgopiYuk/${fileName}`,
          data: json,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true 
        });

        const toast = await this.toastCtrl.create({
          message: `Berhasil! Tersimpan di folder Documents/NgopiYuk`,
          duration: 3500,
          position: 'top',
          color: 'success'
        });
        await toast.present();

      } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const toast = await this.toastCtrl.create({
          message: 'Data berhasil diekspor!',
          duration: 2000,
          position: 'top',
          color: 'success'
        });
        await toast.present();
      }
    } catch (err: any) {
      const toast = await this.toastCtrl.create({
        message: 'Gagal mengekspor data',
        duration: 3500,
        position: 'top',
        color: 'danger'
      });
      await toast.present();
    }
  }

  async importData() {
    const alert = await this.alertCtrl.create({
      header: '⚠️ Impor Data',
      message: 'Data saat ini akan ditimpa dengan data backup. Lanjutkan?',
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Lanjutkan',
          handler: () => {
            this.triggerFileInput();
          }
        }
      ]
    });
    await alert.present();
  }

  async triggerFileInput() {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Filesystem.readdir({
          path: 'NgopiYuk',
          directory: Directory.Documents
        });

        const files = result.files.filter(f => f.name.endsWith('.json'));

        if (files.length === 0) {
          this.showToast('Tidak ada file backup di folder NgopiYuk', 'warning');
          this.openStandardPicker();
          return;
        }

        const actionSheet = await this.actionSheetCtrl.create({
          header: 'Pilih File Backup di folder NgopiYuk',
          buttons: [
            ...files.map(f => ({
              text: f.name,
              handler: () => {
                this.readAndImportFile(f.name);
              }
            })),
            { text: 'Pilih dari folder lain', handler: () => { this.openStandardPicker(); } },
            { text: 'Batal', role: 'cancel' }
          ]
        });
        await actionSheet.present();

      } catch (err) {
        this.openStandardPicker();
      }
    } else {
      this.openStandardPicker();
    }
  }

  async readAndImportFile(fileName: string) {
    try {
      const contents = await Filesystem.readFile({
        path: `NgopiYuk/${fileName}`,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      const data: AppData = JSON.parse(contents.data as string);
      this.processImport(data);
    } catch (err) {
      this.showToast('Gagal membaca file', 'danger');
    }
  }

  openStandardPicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data: AppData = JSON.parse(text);
        this.processImport(data);
      } catch (err) {
        this.showToast('File JSON tidak valid', 'danger');
      }
    };
    input.click();
  }

  async processImport(data: AppData) {
    try {
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Format salah');
      }
      await this.coffeeService.importData(data);
      this.settings = await this.coffeeService.getSettings();
      this.showToast(`${data.entries.length} entri berhasil diimpor!`, 'success');
    } catch (err) {
      this.showToast('Gagal impor: Format data tidak cocok', 'danger');
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color
    });
    await toast.present();
  }

  async clearAllData() {
    const alert = await this.alertCtrl.create({
      header: 'Hapus Semua Data',
      message: 'Apakah Anda yakin? Tindakan ini permanen!',
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: async () => {
            await this.coffeeService.importData({ entries: [], settings: { dailyCaffeineLimit: 400, dailySugarLimit: 50 }, customCoffeeTypes: [] });
            this.settings = { dailyCaffeineLimit: 400, dailySugarLimit: 50 };
            this.showToast('Semua data telah dihapus', 'warning');
          }
        }
      ]
    });
    await alert.present();
  }

  openPrivacyPolicy() { window.open('https://ngopi-yuk.my.id/privacy-policy.php', '_blank'); }
  openTerms() { window.open('https://ngopi-yuk.my.id/terms-of-use.php', '_blank'); }
}