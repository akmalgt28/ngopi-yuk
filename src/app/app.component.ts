import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DisclaimerComponent } from './components/disclaimer/disclaimer.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, DisclaimerComponent],
})
export class AppComponent {
  constructor() {}
}