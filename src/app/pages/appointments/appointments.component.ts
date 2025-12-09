import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [FormsModule, MatButtonModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss']
})
export class AppointmentsComponent {
  formData = {
    name: '',
    email: '',
    phone: '',
    date: '',
    style: '',
    size: '',
    description: '',
    budget: ''
  };
  loading: boolean = false;
  submitted: boolean = false;

  constructor(private firebaseService: FirebaseService) { }

  async onSubmit() {
    if (!this.formData.name || !this.formData.email || !this.formData.phone ||
      !this.formData.date || !this.formData.style || !this.formData.size ||
      !this.formData.description) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.loading = true;

    try {
      const appointmentData = {
        ...this.formData,
        status: 'pending', // Estado inicial: pendiente
        createdAt: new Date()
      };

      const result = await this.firebaseService.addDocument('appointments', appointmentData);

      if (result.success) {
        this.submitted = true;
        // Limpiar formulario
        this.formData = {
          name: '',
          email: '',
          phone: '',
          date: '',
          style: '',
          size: '',
          description: '',
          budget: ''
        };
      } else {
        alert('Error al enviar la solicitud. Por favor intenta nuevamente.');
      }
    } catch (error) {
      alert('Error al enviar la solicitud. Por favor intenta nuevamente.');
    } finally {
      this.loading = false;
    }
  }
}