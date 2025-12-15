import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { interval, Subscription } from 'rxjs';
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
  imports: [RouterLink, CommonModule],
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
        console.log('Imágenes recibidas:', images);
        // Filtrar imágenes que tengan imageUrl válido
        const validImages = images.filter(img => img && img.imageUrl);
        // Ordenar por campo 'order' si existe
        this.carouselImages = validImages.sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log('Imágenes procesadas:', this.carouselImages);
        this.loading = false;
        if (this.carouselImages.length > 0) {
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
      this.currentIndex = (this.currentIndex + 1) % this.carouselImages.length;
    }
  }

  prev() {
    if (this.carouselImages.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + this.carouselImages.length) % this.carouselImages.length;
    }
  }

  goToSlide(index: number) {
    this.currentIndex = index;
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