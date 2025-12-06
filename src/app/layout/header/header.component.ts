import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  private checkInterval: any;

  constructor(private firebaseService: FirebaseService) { }

  ngOnInit() {
    // Verificar estado inicial
    this.checkAuthState();

    // Verificar cada segundo si hay cambios
    this.checkInterval = setInterval(() => {
      this.checkAuthState();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private checkAuthState() {
    this.isLoggedIn = !!this.firebaseService.getCurrentUser();
  }
}