import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FirebaseService } from '../../../../core/services/firebase.service';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(
    private firebaseService: FirebaseService,
    private router: Router
  ) { }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    const result = await this.firebaseService.login(this.email, this.password);

    if (result.success) {
      // Login exitoso, redirigir al dashboard
      this.router.navigate(['/admin/dashboard']);
    } else {
      // Error en el login
      this.error = result.error || 'Error al iniciar sesión';
      this.loading = false;
    }
  }
}