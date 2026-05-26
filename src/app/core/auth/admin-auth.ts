import { User } from '@angular/fire/auth';
import { environment } from '../../../environments/environment';

/** Comprueba si el usuario autenticado es admin (UX; la seguridad real está en reglas Firestore). */
export function isAdminUser(user: User | null | undefined): boolean {
  if (!user?.email) {
    return false;
  }
  const email = user.email.toLowerCase();
  return environment.adminEmails.some((allowed) => allowed.toLowerCase() === email);
}
