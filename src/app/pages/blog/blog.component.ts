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
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {
  posts: any[] = [];
  loading: boolean = true;

  constructor(private firebaseService: FirebaseService) { }

  getMediaSrc(post: any): string | null {
    return post.mediaUrl ?? post.imageUrl ?? null;
  }

  isVideoPost(post: any): boolean {
    if (post.mediaType === 'video') {
      return true;
    }
    const u = this.getMediaSrc(post);
    return !!(u && /\.(mp4|webm|mov|mkv)(\?|#|$)/i.test(u));
  }

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
