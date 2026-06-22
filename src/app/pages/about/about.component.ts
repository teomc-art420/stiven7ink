import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  /** Mismos estilos que filtra el portafolio: cada etiqueta lleva a la galería filtrada. */
  styles = ['Realismo', 'Tradicional', 'Minimalista', 'Geométrico', 'Full Color', 'Black and Gray', 'Blackwork', 'Cover Up'];
}
