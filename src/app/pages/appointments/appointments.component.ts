import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.scss'
})
export class AppointmentsComponent {
  onSubmit() {
    // Por ahora solo muestra un mensaje
    // Más adelante implementaremos el envío real
    alert('¡Gracias por tu solicitud! Te contactaremos pronto.');
  }

}
