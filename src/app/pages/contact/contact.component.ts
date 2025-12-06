import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../core/services/firebase.service';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, CommonModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  loading: boolean = false;
  submitted: boolean = false;

  constructor(private firebaseService: FirebaseService) { }

  async onSubmit() {
    if (!this.formData.name || !this.formData.email || !this.formData.message) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    this.loading = true;

    try {
      const contactData = {
        ...this.formData,
        read: false,
        createdAt: new Date()
      };

      const result = await this.firebaseService.addDocument('contacts', contactData);

      if (result.success) {
        this.submitted = true;
        this.formData = {
          name: '',
          email: '',
          subject: '',
          message: ''
        };
        alert('¡Gracias por tu mensaje! Te contactaremos pronto.');
      } else {
        alert('Error al enviar el mensaje. Por favor intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje. Por favor intenta nuevamente.');
    } finally {
      this.loading = false;
    }
  }
}