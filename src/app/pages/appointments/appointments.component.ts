import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FirebaseService } from '../../core/services/firebase.service';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.scss'
})
export class AppointmentsComponent {
  formData = {
    name: '',
    email: '',
    phone: '',
    date: '',
    timeSlot: '', // Nuevo campo
    style: '',
    size: '',
    description: ''
  };
  loading: boolean = false;
  submitted: boolean = false;

  availableSlots: any[] = [];
  checkingAvailability: boolean = false;
  dateSelected: boolean = false;

  // Horarios base
  private allSlots = [
    { value: 'manana', label: 'Mañana (9:00 AM - 1:00 PM)' },
    { value: 'tarde', label: 'Tarde (2:00 PM - 6:00 PM)' },
    { value: 'noche', label: 'Noche (6:00 PM - 9:00 PM) - *Sujeto a aprobación' }
  ];

  constructor(private firebaseService: FirebaseService) { }

  async onDateChange() {
    if (!this.formData.date) {
      this.dateSelected = false;
      return;
    }

    this.checkingAvailability = true;
    this.dateSelected = true;
    this.formData.timeSlot = ''; // Reset slot selection

    try {
      const existingAppointments = await this.firebaseService.getAppointmentsByDate(this.formData.date);

      // Filtrar slots disponibles
      this.availableSlots = this.allSlots.filter(slot => {
        // Verificar si algún appointment existente ocupa este slot
        const isTaken = existingAppointments.some(app => app.timeSlot === slot.value);
        return !isTaken;
      });

      if (this.availableSlots.length === 0) {
        alert('Lo sentimos, no hay horarios disponibles para esta fecha. Por favor selecciona otra.');
        this.formData.date = '';
        this.dateSelected = false;
      }

    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      this.checkingAvailability = false;
    }
  }

  selectedFile: File | null = null;
  fileName: string = '';

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (file.type.match(/image\/*/) == null) {
        alert('Solo se permiten imágenes.');
        return;
      }
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  validateNumber(event: KeyboardEvent) {
    const charCode = (event.which) ? event.which : event.keyCode;
    // Solo permitir números (0-9)
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  async onSubmit() {
    // La validación principal ya se maneja en el HTML con [disabled]
    // y los mensajes de error en tiempo real.

    this.loading = true;

    try {
      // Re-verificar disponibilidad antes de guardar (doble check)
      const existingAppointments = await this.firebaseService.getAppointmentsByDate(this.formData.date);
      const isTaken = existingAppointments.some(app => app.timeSlot === this.formData.timeSlot);

      if (isTaken) {
        // Esta alerta es específica del backend/lógica de negocio, se puede mantener o mejorar
        alert('Lo sentimos, este horario acaba de ser ocupado recientemente. Por favor selecciona otro.');
        this.loading = false;
        await this.onDateChange(); // Refresh slots
        return;
      }

      let referenceImageUrl = '';

      // Subir imagen si existe
      if (this.selectedFile) {
        const filePath = `appointments/${Date.now()}_${this.selectedFile.name}`;
        const uploadResult = await this.firebaseService.uploadFile(filePath, this.selectedFile);

        if (uploadResult.success && uploadResult.url) {
          referenceImageUrl = uploadResult.url;
        } else {
          console.error('Error uploading image:', uploadResult.error);
          alert('Hubo un problema subiendo la imagen, pero continuaremos con la cita.');
        }
      }

      const appointmentData = {
        ...this.formData,
        referenceImageUrl: referenceImageUrl || null,
        status: 'pending', // Estado inicial: pendiente
        createdAt: new Date()
      };

      const result = await this.firebaseService.addDocument('appointments', appointmentData);

      if (result.success) {
        this.submitted = true;
        this.resetForm();
      } else {
        alert('Error al enviar la solicitud. Por favor intenta nuevamente.');
      }
    } catch (error) {
      alert('Error al enviar la solicitud. Por favor intenta nuevamente.');
    } finally {
      this.loading = false;
    }
  }

  resetForm() {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      date: '',
      timeSlot: '',
      style: '',
      size: '',
      description: ''
    };
    this.dateSelected = false;
    this.availableSlots = [];
    this.selectedFile = null;
    this.fileName = '';
  }
}