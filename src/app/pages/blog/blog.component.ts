import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../core/services/firebase.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  posts: any[] = [];
  loading: boolean = true;

  constructor(private firebaseService: FirebaseService) { }

  ngOnInit(): void {
    this.loadPosts();
  }

  async loadPosts() {
    try {
      this.posts = await this.firebaseService.getCollection('blog');
    } catch (error) {
      console.error('Error loading blog posts:', error);
    } finally {
      this.loading = false;
    }
  }
}
