import { Component, OnInit, HostListener, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent implements OnInit, OnDestroy {
  works: any[] = [];
  filteredWorks: any[] = [];
  selectedFilter: string = 'Todos';
  loading: boolean = true;

  /** Índice del trabajo abierto en el lightbox; null = cerrado. */
  lightboxIndex: number | null = null;

  @ViewChild('inkLayer') inkLayer?: ElementRef<HTMLDivElement>;
  private lastInkX = 0;
  private lastInkY = 0;
  /** Solo en dispositivos con mouse y sin preferencia de movimiento reducido. */
  private readonly inkEnabled =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  styles = ['Todos', 'Realismo', 'Tradicional', 'Minimalista', 'Geométrico', 'Acuarela', 'Blackwork'];

  constructor(private firebaseService: FirebaseService) { }

  async ngOnInit() {
    await this.loadWorks();
  }

  ngOnDestroy(): void {
    this.unlockScroll();
  }

  async loadWorks() {
    this.loading = true;
    this.works = await this.firebaseService.getCollection('portfolio');
    this.filteredWorks = this.works;
    this.loading = false;
  }

  filterByStyle(style: string) {
    this.closeLightbox();
    this.selectedFilter = style;
    if (style === 'Todos') {
      this.filteredWorks = this.works;
    } else {
      this.filteredWorks = this.works.filter(work => work.style === style);
    }
  }

  // ---- Lightbox ----
  get currentWork(): any | null {
    if (this.lightboxIndex === null) {
      return null;
    }
    return this.filteredWorks[this.lightboxIndex] ?? null;
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.lockScroll();
  }

  closeLightbox(): void {
    this.lightboxIndex = null;
    this.unlockScroll();
  }

  nextWork(): void {
    if (this.lightboxIndex === null || this.filteredWorks.length === 0) {
      return;
    }
    this.lightboxIndex = (this.lightboxIndex + 1) % this.filteredWorks.length;
  }

  prevWork(): void {
    if (this.lightboxIndex === null || this.filteredWorks.length === 0) {
      return;
    }
    const len = this.filteredWorks.length;
    this.lightboxIndex = (this.lightboxIndex - 1 + len) % len;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (this.lightboxIndex === null) {
      return;
    }
    switch (event.key) {
      case 'Escape':
        this.closeLightbox();
        break;
      case 'ArrowRight':
        this.nextWork();
        break;
      case 'ArrowLeft':
        this.prevWork();
        break;
    }
  }

  // ---- Estela de "tinta" que sigue al cursor (solo decorativa, en el fondo) ----
  spawnInk(event: MouseEvent): void {
    const layer = this.inkLayer?.nativeElement;
    if (!this.inkEnabled || !layer || this.lightboxIndex !== null) {
      return;
    }

    // Espaciar las gotas: solo cuando el cursor se movió lo suficiente.
    const dx = event.clientX - this.lastInkX;
    const dy = event.clientY - this.lastInkY;
    if (dx * dx + dy * dy < 180) {
      return;
    }
    this.lastInkX = event.clientX;
    this.lastInkY = event.clientY;

    // Límite de partículas vivas para no degradar el rendimiento.
    if (layer.childElementCount > 50) {
      layer.firstElementChild?.remove();
    }

    const rect = layer.getBoundingClientRect();
    const size = 8 + Math.random() * 16;
    const dot = document.createElement('span');
    dot.style.cssText =
      `position:absolute;` +
      `left:${event.clientX - rect.left - size / 2}px;` +
      `top:${event.clientY - rect.top - size / 2}px;` +
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      `background:radial-gradient(circle, rgba(212,35,107,0.55) 0%, rgba(212,35,107,0) 70%);` +
      `will-change:transform,opacity;`;
    layer.appendChild(dot);

    const driftX = (Math.random() - 0.5) * 80;
    const driftY = (Math.random() - 0.5) * 80 - 26; // tendencia a subir, como tinta en agua
    const animation = dot.animate(
      [
        { opacity: 0.9, transform: 'translate(0, 0) scale(0.5)' },
        { opacity: 0, transform: `translate(${driftX}px, ${driftY}px) scale(1.9)` }
      ],
      { duration: 850 + Math.random() * 450, easing: 'ease-out' }
    );
    animation.onfinish = () => dot.remove();
  }

  private lockScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  private unlockScroll(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }
}
