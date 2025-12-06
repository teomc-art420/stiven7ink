import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { FirebaseService } from '../../../core/services/firebase.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const firebaseService = inject(FirebaseService);
  const router = inject(Router);

  const user = firebaseService.getCurrentUser();
  
  if (user) {
    // Usuario autenticado, permitir acceso
    return true;
  } else {
    // Usuario no autenticado, redirigir al login
    router.navigate(['/admin/login']);
    return false;
  }
};