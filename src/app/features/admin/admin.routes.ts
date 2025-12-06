import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { LoginComponent } from './componentes/login/login.component';

export const adminRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./componentes/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'portfolio-manager',
    loadComponent: () => import('../portfolio/portfolio-manager.component').then(m => m.PortfolioManagerComponent),
    canActivate: [adminGuard]
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];