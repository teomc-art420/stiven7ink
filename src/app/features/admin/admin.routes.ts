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
    path: 'appointments-manager',
    loadComponent: () => import('./componentes/appointments-manager/appointments-manager.component').then(m => m.AppointmentsManagerComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'blog-manager',
    loadComponent: () => import('./componentes/blog-manager/blog-manager.component').then(m => m.BlogManagerComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'leads-manager',
    loadComponent: () => import('./componentes/leads-manager/leads-manager.component').then(m => m.LeadsManagerComponent),
    canActivate: [adminGuard]
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];