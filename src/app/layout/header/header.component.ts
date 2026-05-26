import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../core/services/firebase.service';
import { isAdminUser } from '../../core/auth/admin-auth';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatButtonModule, MatIconModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn: boolean = false;
  isMenuOpen: boolean = false;
  /** En producción no se promociona el panel admin en el header. */
  showAdminNav = !environment.production;
  private authSubscription: Subscription | null = null;

  constructor(private firebaseService: FirebaseService) { }

  ngOnInit() {
    this.authSubscription = this.firebaseService.getAuthState().subscribe(user => {
      this.isLoggedIn = isAdminUser(user);
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}