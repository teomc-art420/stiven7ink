import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../../../core/services/firebase.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'admin-carousel-manager',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './carousel-manager.component.html',
    styleUrls: ['./carousel-manager.component.scss']
})
export class CarouselManagerComponent implements OnInit, OnDestroy {
    images: any[] = [];
    loading = false;
    file?: File;
    title = '';
    order = 0;
    private sub?: Subscription;

    constructor(private firebase: FirebaseService) { }

    ngOnInit() {
        this.sub = this.firebase.getHeroCarouselImages().subscribe(list => {
            this.images = list || [];
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    onFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length) {
            this.file = input.files[0];
        }
    }

    async upload() {
        if (!this.file) return alert('Selecciona un archivo primero');
        this.loading = true;
        try {
            const path = `heroCarousel/${Date.now()}_${this.file.name}`;
            const res = await this.firebase.uploadFile(path, this.file);
            if (res.success && res.url) {
                const result = await this.firebase.addDocument('heroCarousel', {
                    imageUrl: res.url,
                    title: this.title || this.file.name,
                    order: this.order || 0,
                    storagePath: path
                });

                if (result.success) {
                    // Limpiar formulario - la lista se actualiza automáticamente por la suscripción
                    this.title = '';
                    this.order = 0;
                    this.file = undefined;
                    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                    if (fileInput) fileInput.value = '';
                    alert('Imagen agregada correctamente');
                } else {
                    alert('Error al guardar en la base de datos: ' + (result.error || 'Error desconocido'));
                }
            } else {
                console.error('Upload failed', res.error);
                alert('Error subiendo el archivo: ' + (res.error || 'Error desconocido'));
            }
        } catch (err: any) {
            console.error('Error en upload:', err);
            alert('Error en upload: ' + (err.message || 'Error desconocido'));
        } finally {
            this.loading = false;
        }
    }

    async remove(item: any) {
        if (!confirm('¿Eliminar esta imagen del carrusel?')) return;
        this.loading = true;
        try {
            // Eliminar imagen de Storage
            if (item.storagePath) {
                const deleteResult = await this.firebase.deleteFile(item.storagePath);
                if (!deleteResult.success) {
                    console.warn('No se pudo eliminar la imagen de Storage:', deleteResult.error);
                }
            }

            // Eliminar documento de Firestore - la lista se actualiza automáticamente por la suscripción
            const result = await this.firebase.deleteDocument('heroCarousel', item.id);

            if (result.success) {
                alert('Imagen eliminada correctamente');
            } else {
                alert('Error al eliminar: ' + (result.error || 'Error desconocido'));
            }
        } catch (err: any) {
            console.error('Error eliminando:', err);
            alert('Error eliminando: ' + (err.message || 'Error desconocido'));
        } finally {
            this.loading = false;
        }
    }
}
