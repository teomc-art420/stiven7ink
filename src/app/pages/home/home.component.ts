import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  works: Array<{ imageUrl?: string; focus?: string }> = [];
  current = 0;
  private intervalRef: any = null;

  constructor(private firebaseService: FirebaseService) { }

  async ngOnInit() {
    try {
      const items = await this.firebaseService.getCollection('portfolio');
      // Keep only items with imageUrl but preserve focus if present
      this.works = items.map((w: any) => ({ imageUrl: w.imageUrl, focus: w.focus })).filter((w: any) => !!w.imageUrl);
    } catch (err) {
      console.error('Error loading carousel images', err);
      this.works = [];
    }

    this.startAutoplay();
  }

  startAutoplay() {
    if (this.intervalRef) return;
    this.intervalRef = setInterval(() => this.next(), 5000);
  }

  stopAutoplay() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  next() {
    const len = Math.max(1, this.works.length);
    this.current = (this.current + 1) % len;
  }

  prev() {
    const len = Math.max(1, this.works.length);
    this.current = (this.current - 1 + len) % len;
  }

  goTo(index: number) {
    this.current = index;
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }
}
