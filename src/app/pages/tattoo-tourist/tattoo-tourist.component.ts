import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FirebaseService } from '../../core/services/firebase.service';
import { MatIconModule } from '@angular/material/icon';

interface City {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  order: number;
}

@Component({
  selector: 'app-tattoo-tourist',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './tattoo-tourist.component.html',
  styleUrls: ['./tattoo-tourist.component.scss']
})
export class TattooTouristComponent implements OnInit {
  cities: City[] = [];
  loading = true;
  expandedCityIds: string[] = [];
  currentLayer: number = 1; // Mostramos la primera imagen por defecto
  activeCityId: string = '';
  activeHotspot: string | null = null;
  readonly descriptionLimit = 120;

  constructor(private firebaseService: FirebaseService) { }

  async ngOnInit() {
    await this.loadCities();
  }

  async loadCities() {
    this.loading = true;
    try {
      const data = await this.firebaseService.getCollection('tattooTouristCities');
      this.cities = data
        .map((city: any) => ({
          id: city.id,
          name: city.name,
          description: city.description,
          imageUrl: city.imageUrl,
          order: city.order ?? 0
        }))
        .sort((a: City, b: City) => a.order - b.order);
      if (this.cities.length > 0) {
        this.activeCityId = this.cities[0].id;
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      this.loading = false;
    }
  }

  isExpanded(cityId: string): boolean {
    return this.expandedCityIds.includes(cityId);
  }

  toggleExpand(cityId: string) {
    const index = this.expandedCityIds.indexOf(cityId);
    if (index >= 0) {
      this.expandedCityIds.splice(index, 1);
    } else {
      this.expandedCityIds.push(cityId);
    }
  }

  // Método opcional para resetear a la primera imagen al salir de la lista
  resetLayer() {
    // Si prefieres que siempre haya una imagen de fondo, dejamos el 1.
    // Si prefieres que vuelva a negro, usa 0.
    this.currentLayer = 1;
  }
}
