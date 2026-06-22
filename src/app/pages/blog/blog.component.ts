import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FirebaseService } from '../../core/services/firebase.service';
import { MatIconModule } from '@angular/material/icon';

export interface BlogPost {
  id: string;
  title: string;
  content?: string;
  mediaUrl?: string;
  imageUrl?: string;
  mediaType?: 'video' | 'image';
  createdAt?: { seconds: number; nanoseconds?: number };
}

type BlogFilter = 'Todos' | 'Vídeos' | 'Artículos';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent implements OnInit {
  readonly skeletonPlaceholders = [0, 1, 2, 3, 4, 5];
  readonly filters: BlogFilter[] = ['Todos', 'Vídeos', 'Artículos'];

  posts: BlogPost[] = [];
  filteredPosts: BlogPost[] = [];
  selectedFilter: BlogFilter = 'Todos';
  loading = true;
  /** Solo una publicación con texto expandido a la vez. */
  expandedPostId: string | null = null;

  constructor(
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef,
  ) {}

  get videoCount(): number {
    return this.posts.filter(p => this.isVideoPost(p)).length;
  }

  getMediaSrc(post: BlogPost): string | null {
    return post.mediaUrl ?? post.imageUrl ?? null;
  }

  isVideoPost(post: BlogPost): boolean {
    if (post.mediaType === 'video') {
      return true;
    }
    const u = this.getMediaSrc(post);
    return !!(u && /\.(mp4|webm|mov|mkv)(\?|#|$)/i.test(u));
  }

  excerpt(post: BlogPost, max = 180): string {
    const raw = (post.content ?? '').trim();
    if (raw.length <= max) {
      return raw;
    }
    return raw.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  hasLongContent(post: BlogPost): boolean {
    return (post.content ?? '').trim().length > 180;
  }

  isExpanded(postId: string): boolean {
    return this.expandedPostId === postId;
  }

  toggleExpand(postId: string): void {
    this.expandedPostId = this.expandedPostId === postId ? null : postId;
    this.cdr.markForCheck();
  }

  setFilter(filter: BlogFilter): void {
    this.selectedFilter = filter;
    this.expandedPostId = null;
    this.applyFilter();
    this.cdr.markForCheck();
  }

  trackByPost = (_index: number, post: BlogPost) =>
    post.id ?? this.getMediaSrc(post) ?? post.title ?? _index;

  ngOnInit(): void {
    this.loadPosts();
  }

  async loadPosts(): Promise<void> {
    try {
      const raw = await this.firebaseService.getCollection('blog');
      this.posts = this.sortPosts(raw as BlogPost[]);
      this.applyFilter();
    } catch (error) {
      console.error('Error loading blog posts:', error);
      this.posts = [];
      this.filteredPosts = [];
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private sortPosts(posts: BlogPost[]): BlogPost[] {
    return [...posts].sort((a, b) => this.getTimestamp(b) - this.getTimestamp(a));
  }

  private getTimestamp(post: BlogPost): number {
    return post.createdAt?.seconds ?? 0;
  }

  private applyFilter(): void {
    switch (this.selectedFilter) {
      case 'Vídeos':
        this.filteredPosts = this.posts.filter(p => this.isVideoPost(p));
        break;
      case 'Artículos':
        this.filteredPosts = this.posts.filter(p => !this.isVideoPost(p));
        break;
      default:
        this.filteredPosts = this.posts;
    }
  }
}
