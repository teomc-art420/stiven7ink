import { Component, OnInit, HostListener, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
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
  @ViewChild('inkTopLayer') inkTopLayer?: ElementRef<HTMLDivElement>;
  private lastInkX = 0;
  private lastInkY = 0;
  private readonly motionOk =
    typeof window !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Estela: solo en dispositivos con mouse. */
  private readonly inkEnabled =
    this.motionOk && typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  styles = ['Todos', 'Realismo', 'Tradicional', 'Minimalista', 'Geométrico', 'Full Color', 'Black and Gray', 'Blackwork', 'Cover Up'];

  constructor(
    private firebaseService: FirebaseService,
    private route: ActivatedRoute
  ) { }

  async ngOnInit() {
    await this.loadWorks();
    // Permite llegar filtrado desde otras secciones: /portfolio?estilo=Realismo
    const estilo = this.route.snapshot.queryParamMap.get('estilo');
    if (estilo === 'Acuarela') {
      this.filterByStyle('Full Color');
    } else if (estilo && this.styles.includes(estilo)) {
      this.filterByStyle(estilo);
    }
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
      this.filteredWorks = this.works.filter(work => this.workMatchesStyle(work.style, style));
    }
  }

  /** Incluye trabajos guardados como "Acuarela" antes del rename a Full Color. */
  private workMatchesStyle(workStyle: string, filterStyle: string): boolean {
    if (workStyle === filterStyle) {
      return true;
    }
    return filterStyle === 'Full Color' && workStyle === 'Acuarela';
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

  // ---- Swipe táctil en el lightbox ----
  private touchStartX = 0;
  private touchStartY = 0;

  onLightboxTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onLightboxTouchEnd(event: TouchEvent): void {
    const dx = event.changedTouches[0].clientX - this.touchStartX;
    const dy = event.changedTouches[0].clientY - this.touchStartY;
    // Solo gestos claramente horizontales (no confundir con scroll vertical).
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) {
        this.nextWork();
      } else {
        this.prevWork();
      }
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
    const driftX = (Math.random() - 0.5) * 80;
    const driftY = (Math.random() - 0.5) * 80 - 26; // tendencia a subir, como tinta en agua
    this.createInkBlob(
      layer,
      event.clientX - rect.left,
      event.clientY - rect.top,
      8 + Math.random() * 16,
      driftX,
      driftY,
      850 + Math.random() * 450,
      0.55
    );
  }

  /** Gota de tinta al hacer click/tap: mancha central + salpicaduras. */
  spawnInkDrop(event: MouseEvent): void {
    const layer = this.inkTopLayer?.nativeElement;
    if (!this.motionOk || !layer) {
      return;
    }

    const rect = layer.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Mancha central que se expande.
    this.createInkBlob(layer, x, y, 46 + Math.random() * 22, 0, 0, 620, 0.4);

    // Salpicaduras pequeñas hacia afuera.
    const droplets = 5;
    for (let i = 0; i < droplets; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 26 + Math.random() * 44;
      this.createInkBlob(
        layer,
        x,
        y,
        6 + Math.random() * 10,
        Math.cos(angle) * dist,
        Math.sin(angle) * dist,
        500 + Math.random() * 300,
        0.6
      );
    }
  }

  private createInkBlob(
    layer: HTMLElement,
    x: number,
    y: number,
    size: number,
    driftX: number,
    driftY: number,
    duration: number,
    peakOpacity: number
  ): void {
    const dot = document.createElement('span');
    dot.style.cssText =
      `position:absolute;` +
      `left:${x - size / 2}px;top:${y - size / 2}px;` +
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      `background:radial-gradient(circle, rgba(212,35,107,${peakOpacity}) 0%, rgba(212,35,107,0) 70%);` +
      `will-change:transform,opacity;`;
    layer.appendChild(dot);

    const animation = dot.animate(
      [
        { opacity: 1, transform: 'translate(0, 0) scale(0.4)' },
        { opacity: 0, transform: `translate(${driftX}px, ${driftY}px) scale(1.8)` }
      ],
      { duration, easing: 'ease-out' }
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
