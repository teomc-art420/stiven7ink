import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.scss'
})
export class PortfolioComponent implements OnInit {
  works: any[] = [];
  filteredWorks: any[] = [];
  selectedFilter: string = 'Todos';
  loading: boolean = true;

  styles = ['Todos', 'Realismo', 'Tradicional', 'Minimalista', 'Geométrico', 'Acuarela', 'Blackwork'];

  constructor(private firebaseService: FirebaseService) { }

  async ngOnInit() {
    await this.loadWorks();
  }

  async loadWorks() {
    this.loading = true;
    this.works = await this.firebaseService.getCollection('portfolio');
    this.filteredWorks = this.works;
    this.loading = false;
  }

  filterByStyle(style: string) {
    this.selectedFilter = style;
    if (style === 'Todos') {
      this.filteredWorks = this.works;
    } else {
      this.filteredWorks = this.works.filter(work => work.style === style);
    }
  }
}