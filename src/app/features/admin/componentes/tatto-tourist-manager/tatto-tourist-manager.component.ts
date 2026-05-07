import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
    imports: [CommonModule, FormsModule],
    templateUrl: './tatto-tourist-manager.component.html',
    styleUrls: ['./tatto-tourist-manager.component.scss']
})
export class TattoTouristManagerComponent implements OnInit {
    cities: TattooTouristCity[] = [];
    loading = false;
    selectedFile: File | null = null;
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
        this.selectedFile = event.target.files[0];
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
        this.loading = true;
        try {
            let imageUrl = this.currentCity.imageUrl;

            if (this.selectedFile) {
                imageUrl = await this.uploadImage() || imageUrl;
            }

            const cityData = {
                ...this.currentCity,
                imageUrl
            };

            if (this.isEditing) {
                // Actualizar ciudad existente
                await this.firebaseService.updateDocument('tattooTouristCities', this.currentCity.id!, cityData);
            } else {
                // Crear nueva ciudad
                await this.firebaseService.addDocument('tattooTouristCities', cityData);
            }

            this.resetForm();
            this.loadCities();
        } catch (error) {
            console.error('Error saving city:', error);
        } finally {
            this.loading = false;
        }
    }

    editCity(city: TattooTouristCity) {
        this.currentCity = { ...city };
        this.isEditing = true;
    }

    async deleteCity(cityId: string) {
        if (confirm('¿Estás seguro de eliminar esta ciudad?')) {
            this.loading = true;
            try {
                await this.firebaseService.deleteDocument('tattooTouristCities', cityId);
                this.loadCities();
            } catch (error) {
                console.error('Error deleting city:', error);
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
        this.isEditing = false;
    }
}