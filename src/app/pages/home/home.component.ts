import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  // Small preview data to avoid template runtime errors.
  // Replace with Firestore-loaded items when ready.
  preview = [
    { id: '1', title: 'Tatuaje A', imageUrl: 'assets/portfolio/1.jpg' },
    { id: '2', title: 'Tatuaje B', imageUrl: 'assets/portfolio/2.jpg' },
    { id: '3', title: 'Tatuaje C', imageUrl: 'assets/portfolio/3.jpg' }
  ];

  constructor(private router: Router) { }

  // Called from the template when a preview item is clicked.
  open(p: any) {
    if (p?.id) {
      this.router.navigate(['/portfolio', p.id]);
    } else {
      this.router.navigate(['/portfolio']);
    }
  }

}