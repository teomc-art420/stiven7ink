import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { FirebaseService } from '../../../core/services/firebase.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const firebaseService = inject(FirebaseService);
  const router = inject(Router);

  return firebaseService.getAuthState().pipe(
    take(1),
    map(user => {

      if (user) {
        // Usuario autenticado, permitir acceso
        return true;
      } else {
        // Usuario no autenticado, redirigir al login
        router.navigate(['/admin/login']);
        return false;
      }
    })
  );
}