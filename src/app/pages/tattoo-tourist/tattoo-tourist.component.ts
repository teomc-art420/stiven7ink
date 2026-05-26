import { Component, OnInit, inject } from '@angular/core';
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
  currentLayer: number = 1; // Mostramos la primera imagen por defecto
  activeCityId: string = '';
  activeHotspot: 'artists' | 'sedation' = 'artists';
  private firebaseService = inject(FirebaseService);

  ngOnInit() {
    this.loadCities();
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

  selectCity(cityId: string): void {
    this.activeCityId = cityId;
  }

  selectFlightLayer(layer: number): void {
    this.currentLayer = layer;
  }

  selectHotspot(hotspot: 'artists' | 'sedation'): void {
    this.activeHotspot = hotspot;
  }

  resetLayer() {
    // Si prefieres que siempre haya una imagen de fondo, dejamos el 1.
    // Si prefieres que vuelva a negro, usa 0.
    this.currentLayer = 1;
  }
}
