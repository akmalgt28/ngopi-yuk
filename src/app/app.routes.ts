import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'add-cup',
    loadComponent: () => import('./components/add-cup/add-cup.component').then((m) => m.AddCupComponent),
  },
];
