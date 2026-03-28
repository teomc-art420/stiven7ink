import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { FirebaseService } from '../../core/services/firebase.service';

import { CommonModule } from '@angular/common';

interface CalendarDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  monthName: string;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
}

interface TimeSlot {
  id: string;
  label: string;
  icon: string;
  time: string;
  note?: string;
  isAvailable?: boolean;
}

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './appointments.component.html',
  styleUrl: './appointments.component.scss'
})
export class AppointmentsComponent implements OnInit {
  formData = {
    name: '',
    email: '',
    phone: '',
    date: '',
    timeSlot: '',
    style: '',
    size: '',
    description: ''
  };
  loading: boolean = false;
  submitted: boolean = false;

  // Calendar Carousel
  currentWeekStart: Date = new Date();
  calendarDays: CalendarDay[] = [];
  selectedDate: Date | null = null;

  // Time Slots
  timeSlots: TimeSlot[] = [
    { id: 'manana', label: 'Mañana', icon: 'wb_sunny', time: '9:00 AM - 1:00 PM', isAvailable: true },
    { id: 'tarde', label: 'Tarde', icon: 'wb_twilight', time: '2:00 PM - 6:00 PM', isAvailable: true },
    { id: 'noche', label: 'Noche', icon: 'nights_stay', time: '6:00 PM - 10:00 PM', note: 'Sujeto a aprobación', isAvailable: true }
  ];
  selectedTimeSlot: string | null = null;
  checkingAvailability: boolean = false;

  // File upload
  selectedFile: File | null = null;
  fileName: string = '';

  constructor(private firebaseService: FirebaseService) { }

  ngOnInit() {
    this.generateCalendarDays();
  }

  // ========== CALENDAR METHODS ==========

  generateCalendarDays() {
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dayDate = new Date(date);

      days.push({
        date: dayDate,
        dayName: this.getDayName(dayDate),
        dayNumber: dayDate.getDate(),
        monthName: this.getMonthName(dayDate),
        isToday: this.isSameDay(dayDate, today),
        isPast: dayDate < today,
        isSelected: this.selectedDate ? this.isSameDay(dayDate, this.selectedDate) : false
      });
    }

    this.calendarDays = days;
  }

  getDayName(date: Date): string {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[date.getDay()];
  }

  getMonthName(date: Date): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[date.getMonth()];
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  get currentMonthYear(): string {
    return `${this.getMonthName(this.currentWeekStart)} ${this.currentWeekStart.getFullYear()}`;
  }

  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.currentWeekStart = new Date(this.currentWeekStart);
    this.generateCalendarDays();
  }

  prevWeek() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newWeekStart = new Date(this.currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);

    // No permitir ir a semanas pasadas
    if (newWeekStart >= today) {
      this.currentWeekStart = newWeekStart;
      this.generateCalendarDays();
    }
  }

  async selectDate(day: CalendarDay) {
    if (day.isPast) return;

    this.selectedDate = day.date;
    this.selectedTimeSlot = null;
    this.formData.timeSlot = '';
    this.formData.date = this.formatDateForFirebase(day.date);
    this.generateCalendarDays();

    // Check availability for this date
    await this.checkDateAvailability();
  }

  formatDateForFirebase(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ========== TIME SLOT METHODS ==========

  async checkDateAvailability() {
    if (!this.selectedDate) return;

    this.checkingAvailability = true;

    try {
      const busySlots = await this.firebaseService.getBusySlotsByDate(this.formData.date);

      // Reset all slots to available
      this.timeSlots.forEach(slot => slot.isAvailable = true);

      // Mark taken slots as unavailable (solo fecha + franja; sin datos personales)
      busySlots.forEach(busy => {
        const slot = this.timeSlots.find(s => s.id === busy.timeSlot);
        if (slot) {
          slot.isAvailable = false;
        }
      });

      // Check if all slots are taken
      const allTaken = this.timeSlots.every(slot => !slot.isAvailable);
      if (allTaken) {
        alert('Lo sentimos, no hay horarios disponibles para esta fecha. Por favor selecciona otra.');
        this.selectedDate = null;
        this.formData.date = '';
        this.generateCalendarDays();
      }

    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      this.checkingAvailability = false;
    }
  }

  selectTimeSlot(slot: TimeSlot) {
    if (!slot.isAvailable || this.checkingAvailability) return;

    this.selectedTimeSlot = slot.id;
    this.formData.timeSlot = slot.id;
  }

  // ========== FILE UPLOAD ==========

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (file.type.match(/image\/*/) == null) {
        alert('Solo se permiten imágenes.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar 5MB.');
        return;
      }
      this.selectedFile = file;
      this.fileName = file.name;
    }
  }

  // ========== VALIDATION ==========

  validateNumber(event: KeyboardEvent) {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  // ========== FORM SUBMISSION ==========

  async onSubmit() {
    this.loading = true;

    try {
      // Re-verificar disponibilidad antes de guardar
      const busySlots = await this.firebaseService.getBusySlotsByDate(this.formData.date);
      const isTaken = busySlots.some(b => b.timeSlot === this.formData.timeSlot);

      if (isTaken) {
        alert('Lo sentimos, este horario acaba de ser ocupado. Por favor selecciona otro.');
        this.loading = false;
        await this.checkDateAvailability();
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

      const result = await this.firebaseService.createPublicAppointmentWithSlot({
        ...this.formData,
        referenceImageUrl: referenceImageUrl ? referenceImageUrl : null
      });

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
    this.selectedDate = null;
    this.selectedTimeSlot = null;
    this.selectedFile = null;
    this.fileName = '';
    this.currentWeekStart = new Date();
    this.generateCalendarDays();
  }
}