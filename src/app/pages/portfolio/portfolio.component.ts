import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../core/services/firebase.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.scss']
})
export class PortfolioComponent implements OnInit {
  works: any[] = [];
  filteredWorks: any[] = [];
  selectedFilter: string = 'Todos';
  loading: boolean = true;
  /** Solo una tarjeta con descripción expandida; al abrir otra, esta se cierra. */
  expandedWorkId: string | null = null;

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
    this.expandedWorkId = null;
    this.selectedFilter = style;
    if (style === 'Todos') {
      this.filteredWorks = this.works;
    } else {
      this.filteredWorks = this.works.filter(work => work.style === style);
    }
  }

  toggleDescriptionExpand(workId: string): void {
    if (this.expandedWorkId === workId) {
      this.expandedWorkId = null;
    } else {
      this.expandedWorkId = workId;
    }
  }

  isDescriptionExpanded(workId: string): boolean {
    return this.expandedWorkId === workId;
  }
}