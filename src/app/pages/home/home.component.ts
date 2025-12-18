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
        if (this.carouselImages.length > 0) {
          console.log(`Carrusel iniciado con ${this.carouselImages.length} imágenes. CurrentIndex: ${this.currentIndex}`);
          this.startAutoPlay();
        }
      },
      error: (err) => {
        console.error('Error loading carousel images:', err);
        this.carouselImages = [];
        this.loading = false;
      }
    });
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