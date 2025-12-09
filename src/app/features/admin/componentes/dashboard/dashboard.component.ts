import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FirebaseService } from '../../../../core/services/firebase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  appointmentCount: number = 0;
  blogCount: number = 0;
  leadsCount: number = 0;

  constructor(private firebaseService: FirebaseService) { }

  async ngOnInit() {
    this.currentUser = this.firebaseService.getCurrentUser();
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      const appointments = await this.firebaseService.getCollection('appointments');
      this.appointmentCount = appointments.filter(a => a.status === 'pending' || !a.status).length;

      const posts = await this.firebaseService.getCollection('blog');
      this.blogCount = posts.length;

      const leads = await this.firebaseService.getCollection('contacts');
      this.leadsCount = leads.filter(l => !l.read).length;
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  async logout() {
    await this.firebaseService.logout();
  }
}