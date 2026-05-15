import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DisclaimerComponent } from './components/disclaimer/disclaimer.component';
import { StatusBar, Style } from '@capacitor/status-bar'; // Import StatusBar

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, DisclaimerComponent],
})
export class AppComponent {
  
  constructor() {
    this.initStatusBar();
  }

  async initStatusBar() {
    try {
      // 1. Matikan overlay agar status bar tidak melayang di atas konten
      await StatusBar.setOverlaysWebView({ overlay: false });
      
      // 2. Atur warna background (Ganti kode hex ini sesuai warna tema aplikasimu)
      await StatusBar.setBackgroundColor({ color: '#121212' }); 
      
      // 3. Atur warna ikon jam & baterai (Style.Light = ikon warna gelap, Style.Dark = ikon warna putih)
      await StatusBar.setStyle({ style: Style.Light });
    } catch (e) {
      // Catch digunakan agar tidak error saat kamu menjalankan ionic serve di browser komputer
      console.log('StatusBar hanya berfungsi di perangkat asli (HP).');
    }
  }
}