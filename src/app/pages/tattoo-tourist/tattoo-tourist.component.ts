import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FirebaseService } from '../../core/services/firebase.service';

interface City {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  images: string[];
  order: number;
}

@Component({
  selector: 'app-tattoo-tourist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tattoo-tourist.component.html',
  styleUrls: ['./tattoo-tourist.component.scss']
})
export class TattooTouristComponent implements OnInit {
  cities: City[] = [];
  loading = true;
  expandedCityIds: string[] = [];
  selectedImageByCity: Record<string, string> = {};
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
          images: city.images?.length ? city.images : [city.imageUrl],
          order: city.order ?? 0
        }))
        .sort((a: City, b: City) => a.order - b.order);

      this.selectedImageByCity = this.cities.reduce((result, city) => {
        result[city.id] = city.images[0] || city.imageUrl;
        return result;
      }, {} as Record<string, string>);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      this.loading = false;
    }
  }

  getFeaturedImage(city: City): string {
    return this.selectedImageByCity[city.id] || city.images[0] || city.imageUrl;
  }

  setFeaturedImage(cityId: string, imageUrl: string) {
    this.selectedImageByCity[cityId] = imageUrl;
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
}
