import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { AboutComponent } from './pages/about/about.component';
import { BlogComponent } from './pages/blog/blog.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { ContactComponent } from './pages/contact/contact.component';
import { TattooTouristComponent } from './pages/tattoo-tourist/tattoo-tourist.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'portfolio', component: PortfolioComponent },
  { path: 'about', component: AboutComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'tattoo-tourist', component: TattooTouristComponent },
  { path: 'appointments', component: AppointmentsComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes) },
  { path: '**', redirectTo: '' }
];
