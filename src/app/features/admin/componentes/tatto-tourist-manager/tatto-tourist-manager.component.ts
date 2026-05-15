import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FirebaseService } from '../../../../core/services/firebase.service';

interface TattooTouristCity {
    id?: string;
    name: string;
    description: string;
    imageUrl: string;
    order: number;
}

@Component({
    selector: 'app-tatto-tourist-manager',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './tatto-tourist-manager.component.html',
    styleUrls: ['./tatto-tourist-manager.component.scss']
})
export class TattoTouristManagerComponent implements OnInit {
    cities: TattooTouristCity[] = [];
    loading = false;
    selectedFile: File | null = null;
    imagePreview: string | null = null;
    currentCity: TattooTouristCity = {
        name: '',
        description: '',
        imageUrl: '',
        order: 0
    };
    isEditing = false;

    constructor(private firebaseService: FirebaseService) { }

    ngOnInit() {
        this.loadCities();
    }

    async loadCities() {
        this.loading = true;
        try {
            const cities = await this.firebaseService.getCollection('tattooTouristCities');
            this.cities = cities
                .map((city: any) => ({
                    id: city.id,
                    name: city.name,
                    description: city.description,
                    imageUrl: city.imageUrl,
                    order: city.order ?? 0
                }))
                .sort((a: TattooTouristCity, b: TattooTouristCity) => a.order - b.order);
        } catch (error) {
            console.error('Error loading cities:', error);
            this.cities = [];
        } finally {
            this.loading = false;
        }
    }

    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            if (!file.type.match(/image\/*/) ) {
                alert('Solo se permiten imágenes');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('La imagen no debe superar 5MB');
                return;
            }
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreview = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    async uploadImage(): Promise<string | null> {
        if (!this.selectedFile) return null;

        try {
            const fileName = `tattoo-tourist/${Date.now()}_${this.selectedFile.name}`;
            const uploadResult = await this.firebaseService.uploadFile(fileName, this.selectedFile);
            return uploadResult.url ?? null;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    }

    async saveCity() {
        if (!this.currentCity.name.trim() || !this.currentCity.description.trim()) {
            alert('Nombre y descripción son requeridos');
            return;
        }

        this.loading = true;
        try {
            let imageUrl = this.currentCity.imageUrl;

            if (this.selectedFile) {
                const uploadedUrl = await this.uploadImage();
                if (uploadedUrl) {
                    imageUrl = uploadedUrl;
                } else {
                    alert('Error subiendo imagen');
                    this.loading = false;
                    return;
                }
            }

            const cityData = {
                ...this.currentCity,
                imageUrl
            };

            if (this.isEditing && this.currentCity.id) {
                await this.firebaseService.updateDocument('tattooTouristCities', this.currentCity.id, cityData);
            } else {
                await this.firebaseService.addDocument('tattooTouristCities', cityData);
            }

            this.resetForm();
            await this.loadCities();
            alert(this.isEditing ? 'Destino actualizado' : 'Destino creado exitosamente');
        } catch (error) {
            console.error('Error saving city:', error);
            alert('Error al guardar el destino');
        } finally {
            this.loading = false;
        }
    }

    editCity(city: TattooTouristCity) {
        this.currentCity = { ...city };
        this.imagePreview = city.imageUrl;
        this.isEditing = true;
    }

    async deleteCity(cityId: string | undefined) {
        if (!cityId) return;
        if (confirm('¿Estás seguro de eliminar esta ciudad?')) {
            this.loading = true;
            try {
                await this.firebaseService.deleteDocument('tattooTouristCities', cityId);
                await this.loadCities();
                alert('Destino eliminado');
            } catch (error) {
                console.error('Error deleting city:', error);
                alert('Error al eliminar el destino');
            } finally {
                this.loading = false;
            }
        }
    }

    resetForm() {
        this.currentCity = {
            name: '',
            description: '',
            imageUrl: '',
            order: 0
        };
        this.selectedFile = null;
        this.imagePreview = null;
        this.isEditing = false;
    }
}