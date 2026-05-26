import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { FirebaseService } from '../../../core/services/firebase.service';
import { isAdminUser } from '../../../core/auth/admin-auth';

export const adminGuard: CanActivateFn = () => {
  const firebaseService = inject(FirebaseService);
  const router = inject(Router);

  return firebaseService.getAuthState().pipe(
    take(1),
    map((user) => {
      if (isAdminUser(user)) {
        return true;
      }
      if (user) {
        void firebaseService.logout();
      } else {
        router.navigate(['/admin/login']);
      }
      return false;
    })
  );
};
