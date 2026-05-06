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
    /** Vídeo corto (entrevistas): ~1 min editado — límite duro en cliente. */
    readonly maxVideoBytes = 48 * 1024 * 1024; // ~48 MB (suficiente para ~1 min bien comprimido)
    readonly maxVideoDurationSec = 62;

    posts: any[] = [];
    loading: boolean = false;
    showForm: boolean = false;
    editingId: string | null = null;

    /** Al editar, conservar medio ya subido si no cambias archivo */
    existingStoragePath: string | null = null;
    existingMediaType: 'video' | 'image' | null = null;

    formData = {
        title: '',
        content: ''
    };

    selectedFile: File | null = null;
    previewUrl: string | null = null;
    isVideo: boolean = false;

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
        this.isVideo = false;
        this.editingId = null;
        this.existingStoragePath = null;
        this.existingMediaType = null;
    }

    private sanitizeStorageFileName(name: string): string {
        const base = name.replace(/[^a-zA-Z0-9._-]/g, '_');
        return base.length > 100 ? base.slice(0, 100) : base;
    }

    /** Comprueba duración del vídeo en el navegador (ideal ≤ 1 min). */
    private validateVideoDuration(file: File): Promise<boolean> {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const v = document.createElement('video');
            v.muted = true;
            v.preload = 'metadata';
            let settled = false;
            const finalize = (ok: boolean) => {
                if (settled) {
                    return;
                }
                settled = true;
                window.clearTimeout(tid);
                URL.revokeObjectURL(url);
                resolve(ok);
            };
            const tid = window.setTimeout(() => finalize(false), 15000);

            v.onloadedmetadata = () => {
                const d = v.duration;
                if (!Number.isFinite(d) || d <= 0) {
                    finalize(false);
                    return;
                }
                finalize(d <= this.maxVideoDurationSec);
            };
            v.onerror = () => finalize(false);
            v.src = url;
        });
    }

    async onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        if (!/^image\/|video\//.test(file.type)) {
            this.showSnackBar('Solo imágenes o vídeos (MP4, WebM, MOV…)', 'Cerrar');
            input.value = '';
            return;
        }

        const isVideo = file.type.startsWith('video/');

        if (isVideo) {
            if (file.size > this.maxVideoBytes) {
                this.showSnackBar(
                    `Vídeo muy pesado (máx. ${Math.round(this.maxVideoBytes / (1024 * 1024))} MB). Comprímelo un poco más.`,
                    'Cerrar'
                );
                input.value = '';
                return;
            }
            const durationOk = await this.validateVideoDuration(file);
            if (!durationOk) {
                this.showSnackBar(`El vídeo debe durar máximo ${this.maxVideoDurationSec - 2} segundos (~1 minuto).`, 'Cerrar');
                input.value = '';
                return;
            }
        }

        const maxImg = 12 * 1024 * 1024;
        if (!isVideo && file.size > maxImg) {
            this.showSnackBar('Imagen máximo 12 MB', 'Cerrar');
            input.value = '';
            return;
        }

        this.selectedFile = file;
        this.isVideo = isVideo;

        const reader = new FileReader();
        reader.onload = () => {
            this.previewUrl = reader.result as string;
        };
        reader.readAsDataURL(file);

        input.value = '';
    }

    async onSubmit() {
        if (!this.formData.title || !this.formData.content) return;

        this.loading = true;
        try {
            let mediaUrl: string | null = null;
            let storagePath: string | null = null;
            let mediaType: 'video' | 'image' | null = null;

            if (this.selectedFile) {
                storagePath = `blog/${Date.now()}_${this.sanitizeStorageFileName(this.selectedFile.name)}`;
                const uploadResult = await this.firebaseService.uploadFile(storagePath, this.selectedFile);
                if (!uploadResult.success || !uploadResult.url) {
                    this.showSnackBar('Error al subir el archivo', 'Cerrar');
                    this.loading = false;
                    return;
                }
                mediaUrl = uploadResult.url;
                mediaType = this.isVideo ? 'video' : 'image';

                if (this.editingId && this.existingStoragePath && this.existingStoragePath !== storagePath) {
                    await this.firebaseService.deleteFile(this.existingStoragePath).catch(() => undefined);
                }
            } else if (this.editingId) {
                mediaUrl = this.previewUrl;
                storagePath = this.existingStoragePath;
                mediaType = this.existingMediaType;
            }
            // Alta nueva sin archivo: sin media (solo texto).

            const postData = {
                ...this.formData,
                mediaUrl,
                imagePath: storagePath,
                mediaType
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
        this.previewUrl = post.mediaUrl || post.imageUrl || null;
        const looksVideoUrl = !!(this.previewUrl && /\.(mp4|webm|mov|mkv)(\?|$)/i.test(this.previewUrl));
        this.isVideo = post.mediaType === 'video' || looksVideoUrl;
        this.existingStoragePath = post.imagePath ?? post.mediaPath ?? null;
        this.existingMediaType = this.previewUrl ? (this.isVideo ? 'video' : post.mediaType === 'image' ? 'image' : 'image') : null;
        this.selectedFile = null;
        this.showForm = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async deletePost(post: any) {
        if (!confirm('¿Estás seguro de eliminar este artículo?')) return;

        this.loading = true;
        try {
            // 1. Eliminar archivo si existe
            const pathToDelete = post.imagePath ?? post.mediaPath;
            if (pathToDelete) {
                const deleteResult = await this.firebaseService.deleteFile(pathToDelete);
                if (!deleteResult.success) {
                    console.warn('No se pudo eliminar el archivo:', deleteResult.error);
                }
            }

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

    onVideoError(event: any, post: any) {
        console.error('Error cargando video:', post.title, event);
        this.showSnackBar(`Error cargando video: ${post.title}`, 'Cerrar');
    }
}
