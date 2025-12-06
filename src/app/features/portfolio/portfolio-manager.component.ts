import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-portfolio-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './portfolio-manager.component.html',
  styleUrl: './portfolio-manager.component.scss'
})
export class PortfolioManagerComponent implements OnInit {
  works: any[] = [];
  loading: boolean = false;
  
  // Formulario
  showForm: boolean = false;
  editingWork: any = null;
  formData = {
    title: '',
    style: '',
    description: '',
    image: null as File | null
  };
  imagePreview: string | null = null;

  styles = ['Realismo', 'Tradicional', 'Minimalista', 'Geométrico', 'Acuarela', 'Blackwork'];

  constructor(private firebaseService: FirebaseService) { }

  async ngOnInit() {
    await this.loadWorks();
  }

  async loadWorks() {
    this.loading = true;
    this.works = await this.firebaseService.getCollection('portfolio');
    this.loading = false;
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.formData.image = file;
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit() {
    if (!this.formData.title || !this.formData.style || !this.formData.image) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    this.loading = true;

    try {
      // 1. Subir imagen a Storage
      const imagePath = `portfolio/${Date.now()}_${this.formData.image.name}`;
      const uploadResult = await this.firebaseService.uploadFile(imagePath, this.formData.image);

      if (!uploadResult.success) {
        alert('Error al subir la imagen');
        this.loading = false;
        return;
      }

      // 2. Guardar datos en Firestore
      const workData = {
        title: this.formData.title,
        style: this.formData.style,
        description: this.formData.description || '',
        imageUrl: uploadResult.url,
        imagePath: imagePath
      };

      if (this.editingWork) {
        // Actualizar trabajo existente
        await this.firebaseService.updateDocument('portfolio', this.editingWork.id, workData);
      } else {
        // Crear nuevo trabajo
        await this.firebaseService.addDocument('portfolio', workData);
      }

      // 3. Recargar lista
      await this.loadWorks();
      
      // 4. Limpiar formulario
      this.resetForm();
      alert(this.editingWork ? 'Trabajo actualizado correctamente' : 'Trabajo agregado correctamente');
    } catch (error) {
      alert('Error al guardar el trabajo');
      this.loading = false;
    }
  }

  async deleteWork(work: any) {
    if (!confirm('¿Estás seguro de eliminar este trabajo?')) {
      return;
    }

    this.loading = true;

    try {
      // Eliminar imagen de Storage
      if (work.imagePath) {
        await this.firebaseService.deleteFile(work.imagePath);
      }

      // Eliminar documento de Firestore
      await this.firebaseService.deleteDocument('portfolio', work.id);

      // Recargar lista
      await this.loadWorks();
      alert('Trabajo eliminado correctamente');
    } catch (error) {
      alert('Error al eliminar el trabajo');
      this.loading = false;
    }
  }

  editWork(work: any) {
    this.editingWork = work;
    this.formData = {
      title: work.title,
      style: work.style,
      description: work.description || '',
      image: null
    };
    this.imagePreview = work.imageUrl;
    this.showForm = true;
  }

  resetForm() {
    this.formData = {
      title: '',
      style: '',
      description: '',
      image: null
    };
    this.imagePreview = null;
    this.editingWork = null;
    this.showForm = false;
  }
}