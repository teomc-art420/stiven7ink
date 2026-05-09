import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FirebaseService } from '../../core/services/firebase.service';

interface CarouselImage {
  id: string;
  imageUrl: string;
  title: string;
  order?: number;
}

interface TouristCityPreview {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  images?: string[];
  order: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  carouselImages: CarouselImage[] = [];
  currentIndex = 0;
  loading = true;
  previewCities: TouristCityPreview[] = [];
  private autoPlaySub?: Subscription;

  // Small preview data to avoid template runtime errors.
  // Replace with Firestore-loaded items when ready.
  preview = [
    { id: '1', title: 'Tatuaje A', imageUrl: 'assets/portfolio/1.jpg' },
    { id: '2', title: 'Tatuaje B', imageUrl: 'assets/portfolio/2.jpg' },
    { id: '3', title: 'Tatuaje C', imageUrl: 'assets/portfolio/3.jpg' }
  ];

  portfolioPreview: any[] = [];
  constructor(private router: Router, private firebaseService: FirebaseService) { }

  ngOnInit() {
    this.loadCarouselImages();
    this.loadPreviewCities();
  }

  ngOnDestroy() {
    if (this.autoPlaySub) this.autoPlaySub.unsubscribe();
  }

  loadCarouselImages() {
    this.firebaseService.getHeroCarouselImages().subscribe({
      next: (images) => {
        console.log('Imágenes recibidas desde Firebase:', images);
        // Filtrar imágenes que tengan imageUrl válido
        const validImages = images.filter(img => {
          const isValid = img && img.imageUrl;
          if (!isValid) {
            console.warn('Imagen inválida (sin imageUrl):', img);
          }
          return isValid;
        });
        console.log('Imágenes válidas:', validImages.length);

        // Ordenar por campo 'order' si existe - asegurar que order sea número
        this.carouselImages = validImages.sort((a, b) => {
          const orderA = typeof a.order === 'number' ? a.order : (a.order ? Number(a.order) : 0);
          const orderB = typeof b.order === 'number' ? b.order : (b.order ? Number(b.order) : 0);
          return orderA - orderB;
        });

        // Log detallado de cada imagen
        console.log('Imágenes procesadas y ordenadas:');
        this.carouselImages.forEach((img, index) => {
          console.log(`  [${index}] Orden: ${img.order || 0}, Título: ${img.title}, URL: ${img.imageUrl?.substring(0, 50)}...`);
        });

        this.loading = false;

        // Reiniciar autoplay si cambia el número de imágenes
        if (this.carouselImages.length > 0) {
          console.log(`Carrusel actualizado con ${this.carouselImages.length} imágenes.`);

          // Ajustar currentIndex si está fuera de rango
          if (this.currentIndex >= this.carouselImages.length) {
            this.currentIndex = 0;
          }

          // Reiniciar autoplay solo si no está activo
          if (!this.autoPlaySub || this.autoPlaySub.closed) {
            this.startAutoPlay();
          }
        } else {
          // Si no hay imágenes, detener autoplay
          if (this.autoPlaySub) {
            this.autoPlaySub.unsubscribe();
          }
        }
      },
      error: (err) => {
        console.error('Error loading carousel images:', err);
        this.carouselImages = [];
        this.loading = false;
      }
    });
  }

  async loadPreviewCities() {
    try {
      const data = await this.firebaseService.getCollection('tattooTouristCities');
      this.previewCities = data
        .map((city: any) => ({
          id: city.id,
          name: city.name,
          description: city.description,
          imageUrl: city.imageUrl || (city.images && city.images[0]) || '',
          images: city.images,
          order: city.order ?? 0
        }))
        .sort((a: TouristCityPreview, b: TouristCityPreview) => a.order - b.order)
        .slice(0, 3); // Tomar solo los 3 primeros
    } catch (error) {
      console.error('Error loading tourist cities:', error);
    }
  }

  startAutoPlay() {
    this.autoPlaySub = interval(5000).subscribe(() => {
      this.next();
    });
  }

  next() {
    if (this.carouselImages.length > 0) {
      const oldIndex = this.currentIndex;
      this.currentIndex = (this.currentIndex + 1) % this.carouselImages.length;
      console.log(`Navegando: ${oldIndex} → ${this.currentIndex} (Orden: ${this.carouselImages[this.currentIndex]?.order || 0})`);
    }
  }

  prev() {
    if (this.carouselImages.length > 0) {
      const oldIndex = this.currentIndex;
      this.currentIndex = (this.currentIndex - 1 + this.carouselImages.length) % this.carouselImages.length;
      console.log(`Navegando: ${oldIndex} → ${this.currentIndex} (Orden: ${this.carouselImages[this.currentIndex]?.order || 0})`);
    }
  }

  goToSlide(index: number) {
    const oldIndex = this.currentIndex;
    this.currentIndex = index;
    console.log(`Click en dot: ${oldIndex} → ${index} (Orden: ${this.carouselImages[index]?.order || 0})`);
  }

  onImageError(event: any, img: CarouselImage, index: number) {
    console.error(`❌ Error cargando imagen [${index}] (Orden: ${img.order || 0}):`, {
      title: img.title,
      imageUrl: img.imageUrl,
      error: event
    });
  }

  onImageLoad(event: any, img: CarouselImage, index: number) {
    console.log(`✅ Imagen cargada [${index}] (Orden: ${img.order || 0}):`, {
      title: img.title,
      isActive: index === this.currentIndex,
      imageUrl: img.imageUrl?.substring(0, 50) + '...'
    });
  }

  // Called from the template when a preview item is clicked.
  open(p: any) {
    if (p?.id) {
      this.router.navigate(['/portfolio', p.id]);
    } else {
      this.router.navigate(['/portfolio']);
    }
  }

}