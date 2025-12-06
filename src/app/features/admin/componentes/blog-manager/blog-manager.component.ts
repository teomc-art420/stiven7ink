import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../../../core/services/firebase.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    selector: 'app-blog-manager',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ],
    templateUrl: './blog-manager.component.html',
    styleUrls: ['./blog-manager.component.scss']
})
export class BlogManagerComponent implements OnInit {
    posts: any[] = [];
    loading: boolean = false;
    showForm: boolean = false;
    editingId: string | null = null;

    formData = {
        title: '',
        content: ''
    };

    selectedFile: File | null = null;
    previewUrl: string | null = null;

    constructor(
        private firebaseService: FirebaseService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadPosts();
    }

    async loadPosts() {
        this.loading = true;
        try {
            this.posts = await this.firebaseService.getCollection('blog');
        } catch (error) {
            console.error('Error loading posts:', error);
            this.showSnackBar('Error al cargar los artículos', 'Cerrar');
        } finally {
            this.loading = false;
        }
    }

    toggleForm() {
        this.showForm = !this.showForm;
        if (!this.showForm) {
            this.resetForm();
        }
    }

    resetForm() {
        this.formData = { title: '', content: '' };
        this.selectedFile = null;
        this.previewUrl = null;
        this.editingId = null;
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = () => {
                this.previewUrl = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    async onSubmit() {
        if (!this.formData.title || !this.formData.content) return;

        this.loading = true;
        try {
            let imageUrl = this.previewUrl; // Mantener URL existente si no se cambia imagen

            // Si hay nueva imagen seleccionada, subirla
            if (this.selectedFile) {
                const path = `blog/${Date.now()}_${this.selectedFile.name}`;
                const uploadResult = await this.firebaseService.uploadFile(path, this.selectedFile);
                if (uploadResult.success) {
                    imageUrl = uploadResult.url || null;
                }
            }

            const postData = {
                ...this.formData,
                imageUrl,
                imagePath: this.selectedFile ? `blog/${Date.now()}_${this.selectedFile.name}` : null // Guardar path para borrar después
            };

            let result;
            if (this.editingId) {
                result = await this.firebaseService.updateDocument('blog', this.editingId, postData);
            } else {
                result = await this.firebaseService.addDocument('blog', postData);
            }

            if (result.success) {
                this.showSnackBar(this.editingId ? 'Artículo actualizado' : 'Artículo publicado', 'OK');
                this.toggleForm();
                this.loadPosts();
            } else {
                this.showSnackBar('Error al guardar', 'Cerrar');
            }
        } catch (error) {
            console.error('Error saving post:', error);
            this.showSnackBar('Error al guardar', 'Cerrar');
        } finally {
            this.loading = false;
        }
    }

    editPost(post: any) {
        this.editingId = post.id;
        this.formData = {
            title: post.title,
            content: post.content
        };
        this.previewUrl = post.imageUrl;
        this.showForm = true;
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async deletePost(post: any) {
        if (!confirm('¿Estás seguro de eliminar este artículo?')) return;

        this.loading = true;
        try {
            // 1. Eliminar imagen si existe (esto requeriría guardar el path de la imagen, 
            // por ahora simplificamos borrando solo el doc si no tenemos el path exacto,
            // pero idealmente deberíamos guardar imagePath en el documento)

            // 2. Eliminar documento
            const result = await this.firebaseService.deleteDocument('blog', post.id);

            if (result.success) {
                this.posts = this.posts.filter(p => p.id !== post.id);
                this.showSnackBar('Artículo eliminado', 'OK');
            } else {
                this.showSnackBar('Error al eliminar', 'Cerrar');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showSnackBar('Error al eliminar', 'Cerrar');
        } finally {
            this.loading = false;
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
