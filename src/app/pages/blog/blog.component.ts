import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../core/services/firebase.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent implements OnInit {
  readonly skeletonPlaceholders = [0, 1, 2, 3, 4, 5];

  posts: any[] = [];
  loading: boolean = true;

  constructor(
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef,
  ) {}

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

  excerpt(post: any, max = 180): string {
    const raw = (post?.content ?? '').trim();
    if (raw.length <= max) return raw;
    return raw.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  trackByPost = (_index: number, post: any) =>
    post?.id ?? this.getMediaSrc(post) ?? post?.title ?? _index;

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
      this.cdr.markForCheck();
    }
  }
}
