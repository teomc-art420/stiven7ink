import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../core/services/firebase.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-appointments-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './appointments-manager.component.html',
  styleUrls: ['./appointments-manager.component.scss']
})
export class AppointmentsManagerComponent implements OnInit {
  appointments: any[] = [];
  filteredAppointments: any[] = [];
  loading: boolean = true;
  currentFilter: string = 'all';

  constructor(
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadAppointments();
  }

  async loadAppointments() {
    this.loading = true;
    try {
      this.appointments = await this.firebaseService.getCollection('appointments');
      this.applyFilter();
    } catch (error) {
      console.error('Error loading appointments:', error);
      this.showSnackBar('Error al cargar las citas', 'Cerrar');
    } finally {
      this.loading = false;
    }
  }

  filterAppointments(event: any) {
    // MatChipListbox change event emits { source: ..., value: ... }
    // If it's a single selection, value is the value of the selected chip.
    // However, the event structure might vary depending on Angular Material version.
    // Let's handle the value safely.
    this.currentFilter = event.value || 'all';
    this.applyFilter();
  }

  applyFilter() {
    if (this.currentFilter === 'all') {
      this.filteredAppointments = [...this.appointments];
    } else {
      this.filteredAppointments = this.appointments.filter(app =>
        (app.status || 'pending') === this.currentFilter
      );
    }
  }

  async updateStatus(id: string, status: 'confirmed' | 'cancelled', price?: string) {
    try {
      const data: any = { status };
      if (status === 'confirmed' && price) {
        data.negotiatedPrice = price;
      }

      const result = await this.firebaseService.updateDocument('appointments', id, data);
      if (result.success) {
        // Update local state
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
          this.appointments[index].status = status;
          if (price) {
            this.appointments[index].negotiatedPrice = price;
          }
          this.applyFilter();
        }
        if (status === 'cancelled') {
          const app = this.appointments.find(a => a.id === id);
          if (app?.date && app?.timeSlot) {
            await this.firebaseService.deleteBusySlot(app.date, app.timeSlot);
          }
        }
        this.showSnackBar(`Cita ${status === 'confirmed' ? 'confirmada' : 'cancelada'} correctamente`, 'OK');
      } else {
        this.showSnackBar('Error al actualizar el estado', 'Cerrar');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      this.showSnackBar('Error al actualizar el estado', 'Cerrar');
    }
  }

  async deleteAppointment(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const toRemove = this.appointments.find(a => a.id === id);
      const result = await this.firebaseService.deleteDocument('appointments', id);
      if (result.success) {
        if (toRemove?.date && toRemove?.timeSlot) {
          await this.firebaseService.deleteBusySlot(toRemove.date, toRemove.timeSlot);
        }
        // Remove from local state
        this.appointments = this.appointments.filter(a => a.id !== id);
        this.applyFilter();
        this.showSnackBar('Cita eliminada correctamente', 'OK');
      } else {
        this.showSnackBar('Error al eliminar la cita', 'Cerrar');
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
      this.showSnackBar('Error al eliminar la cita', 'Cerrar');
    }
  }

  private showSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'bottom'
    });
  }
}
