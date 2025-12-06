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
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;

  constructor(private firebaseService: FirebaseService) { }

  ngOnInit() {
    this.currentUser = this.firebaseService.getCurrentUser();
  }

  async logout() {
    await this.firebaseService.logout();
  }
}