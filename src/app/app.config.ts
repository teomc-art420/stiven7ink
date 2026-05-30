import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideStorage, getStorage } from '@angular/fire/storage';
import { provideAppCheck, initializeAppCheck, ReCaptchaV3Provider } from '@angular/fire/app-check';

// App Check (anti-abuso) solo se activa si hay clave reCAPTCHA configurada.
// Sin clave, no se registra el proveedor y la app funciona igual que antes.
const appCheckProviders = environment.recaptchaSiteKey
  ? [
      provideAppCheck(() =>
        initializeAppCheck(getApp(), {
          provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true
        })
      )
    ]
  : [];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    ...appCheckProviders
  ]
};