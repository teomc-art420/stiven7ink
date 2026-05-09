import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fixed-social-links',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fixed-social-links.component.html',
  styleUrls: ['./fixed-social-links.component.scss']
})
export class FixedSocialLinksComponent {
  socialLinks = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/stiven7ink/',
      icon: 'instagram',
      ariaLabel: 'Síguenos en Instagram'
    },
    {
      name: 'WhatsApp',
      url: 'https://wa.me/573124194089',
      icon: 'whatsapp',
      ariaLabel: 'Contáctanos por WhatsApp'
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/Stevencardenass/',
      icon: 'facebook',
      ariaLabel: 'Síguenos en Facebook'
    },
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@stiven7ink',
      icon: 'tiktok',
      ariaLabel: 'Síguenos en TikTok'
    }
  ];
}
