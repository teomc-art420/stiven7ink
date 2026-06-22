import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  loading = false;
  submitted = false;

  constructor(private firebaseService: FirebaseService) { }

  validateNumber(event: KeyboardEvent): boolean {
    const char = event.key;
    if (!/^[0-9]$/.test(char)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  resetForm(): void {
    this.submitted = false;
    this.formData = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
  }

  async onSubmit(): Promise<void> {
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
