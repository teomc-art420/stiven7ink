import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FirebaseService } from '../../../../core/services/firebase.service';

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
  styleUrls: ['./portfolio-manager.component.scss']
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
        const result = await this.firebaseService.updateDocument('portfolio', this.editingWork.id, workData);
        if (result.success) {
          // Update local state
          const index = this.works.findIndex(w => w.id === this.editingWork.id);
          if (index !== -1) {
            this.works[index] = { ...this.works[index], ...workData };
          }
          alert('Trabajo actualizado correctamente');
        } else {
          throw new Error(result.error);
        }

      } else {
        // Crear nuevo trabajo
        const result = await this.firebaseService.addDocument('portfolio', workData);
        if (result.success) {
          // Add to local state (prepend to top)
          this.works.unshift({ id: result.id, ...workData });
          alert('Trabajo agregado correctamente');
        } else {
          throw new Error(result.error);
        }
      }

      // 4. Limpiar formulario
      this.loading = false; // Stop loading before resetting/closing
      this.resetForm();

    } catch (error) {
      console.error(error);
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
      const result = await this.firebaseService.deleteDocument('portfolio', work.id);

      if (result.success) {
        // Remove from local state
        this.works = this.works.filter(w => w.id !== work.id);
        alert('Trabajo eliminado correctamente');
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error(error);
      alert('Error al eliminar el trabajo');
    } finally {
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