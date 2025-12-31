import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FirebaseService } from '../../../../core/services/firebase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;

  // Stats
  portfolioCount: number = 0;
  appointmentCount: number = 0;
  totalAppointments: number = 0;
  blogCount: number = 0;
  leadsCount: number = 0;
  totalLeads: number = 0;
  carouselCount: number = 0;

  loading: boolean = true;

  constructor(private firebaseService: FirebaseService) { }

  async ngOnInit() {
    this.currentUser = this.firebaseService.getCurrentUser();
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading = true;
    try {
      // Portfolio
      const portfolio = await this.firebaseService.getCollection('portfolio');
      this.portfolioCount = portfolio.length;

      // Appointments
      const appointments = await this.firebaseService.getCollection('appointments');
      this.totalAppointments = appointments.length;
      this.appointmentCount = appointments.filter(a => a.status === 'pending' || !a.status).length;

      // Blog
      const posts = await this.firebaseService.getCollection('blog');
      this.blogCount = posts.length;

      // Leads/Contacts
      const leads = await this.firebaseService.getCollection('contacts');
      this.totalLeads = leads.length;
      this.leadsCount = leads.filter(l => !l.read).length;

      // Carousel
      const carousel = await this.firebaseService.getCollection('carousel');
      this.carouselCount = carousel.length;
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading = false;
    }
  }

  async logout() {
    await this.firebaseService.logout();
  }
}