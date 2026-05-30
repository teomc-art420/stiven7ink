# Pre-lanzamiento Stiven7ink — seguridad, deploy y SEO

Documento operativo para publicar de forma **segura y publicable** (no requiere el 100% del producto).

## Cambios aplicados en el repo

| Área | Cambio |
|------|--------|
| `tattooTouristCities` | Solo admin puede crear/editar/borrar; lectura pública. |
| `isAdmin()` | Reglas Firestore/Storage: solo `Harolstiven110@gmail.com` (debe coincidir con Firebase Auth). |
| `busySlots` | Create público acotado (necesario para citas en batch anónimo). Delete solo admin. |
| `adminGuard` + login | Rechaza cuentas autenticadas que no sean admin. |
| Header producción | Ocultos enlaces Login/Admin (`environment.production`). |
| SEO | `lang="es"`, meta description, Open Graph, `public/robots.txt`, `public/sitemap.xml`. |
| Scripts npm | `build:prod`, `deploy:rules`, `deploy:hosting`, `deploy`. |

### Si cambias el email admin

Actualizar **los tres** sitios con el mismo valor exacto (Firebase distingue mayúsculas en el token):

1. `src/environments/environment.ts` y `environment.prod.ts` → `adminEmails`
2. `firestore.rules` → función `isAdmin()` (en **minúsculas**: la regla usa `.lower()`)
3. `storage.rules` → función `isAdmin()` (en **minúsculas**)

> Nota: las reglas comparan el email en minúsculas (`.lower()`), así que el valor en `isAdmin()` debe escribirse siempre en minúsculas aunque la cuenta se haya creado con mayúsculas.

### M2 — Email verificado (OBLIGATORIO antes de desplegar)

`isAdmin()` ahora exige `email_verified == true`. **Si el email admin no está verificado, el admin no podrá leer/gestionar datos.**

Cómo verificar el email de la cuenta admin:

1. Firebase Console → **Authentication → Users**.
2. En la fila de `Harolstiven110@gmail.com`, menú (⋮) → **Reset password** (envía un correo de restablecimiento).
3. Abre el enlace del correo y completa el cambio de contraseña. **Al completar el restablecimiento, Firebase marca el email como verificado.**
4. Vuelve a `/admin/login`, inicia sesión y confirma que ves las citas.

Si por algún motivo el admin queda bloqueado, **rollback**: quitar la línea `&& request.auth.token.email_verified == true` en `firestore.rules` y `storage.rules` y redeployar (`npm run deploy:rules`).

### M3 — App Check (anti-abuso de escritura pública)

El código ya está integrado y **desactivado por defecto** (`recaptchaSiteKey: ''` → no rompe nada). Para activarlo:

1. Firebase Console → **App Check** → registra la app web con **reCAPTCHA v3** y copia la *site key*.
2. Pega la clave en `recaptchaSiteKey` de `environment.ts` y `environment.prod.ts`.
3. `npm run build:prod && npm run deploy:hosting`.
4. Verifica en App Check que llegan tokens (estado "verified") antes de **forzar** (Enforce) Firestore y Storage.
5. Activa **Enforce** en App Check para Firestore y Storage. A partir de ahí, solo las peticiones desde la app real (con token reCAPTCHA) podrán escribir.

> No actives "Enforce" hasta confirmar tráfico verificado, o bloquearás las escrituras legítimas (citas/contacto).

### Otros endurecimientos (post-lanzamiento)

- **Restringir API key** por referrer HTTP en Google Cloud Console.
- **CSP** (`Content-Security-Policy`) en `firebase.json`.
- **2FA** en la cuenta Google del proyecto.

---

## FASE 0 — Verificación manual (consola Firebase)

- [ ] Reglas en producción = archivos del repo (`firebase deploy --only firestore:rules,storage` y revisar en Console → Firestore/Storage → Rules).
- [ ] Auth → Sign-in: Email/Password **activo**.
- [ ] Auth → Settings → Authorized domains: `stiven7ink.web.app`, `firebaseapp.com`, dominio propio.
- [ ] Auth → Users: **solo** cuenta(s) admin; sin registro público (no hay `createUser` en la app; no habilitar proveedores extra).
- [ ] Incógnito: `/`, `/portfolio`, `/tattoo-tourist`, `/blog`, `/appointments`, `/contact` cargan.
- [ ] Incógnito: en DevTools/REST **no** puede leer `appointments` ni `contacts`.

---

## Deploy reproducible

Desde la carpeta `stiven7ink/`:

```bash
npm install
npx firebase login
npm run build:prod
npm run deploy:rules
npm run deploy:hosting
```

(`firebase-tools` va en devDependencies; los scripts usan `npx firebase`.)

O todo junto:

```bash
npm run deploy
```

**Importante:** tras cada cambio en `firestore.rules` o `storage.rules`:

```bash
npm run deploy:rules
```

---

## FASE 3 — Google Search Console (humano)

1. [Search Console](https://search.google.com/search-console) → propiedad `https://stiven7ink.web.app` (o dominio propio).
2. Verificar (DNS TXT o archivo HTML).
3. Sitemaps → enviar `https://stiven7ink.web.app/sitemap.xml`.
4. Inspección de URL → solicitar indexación de `/` y `/tattoo-tourist`.
5. Bios de redes → enlace al dominio web; 1–2 posts con link directo.

Si el dominio final **no** es `stiven7ink.web.app`, actualizar:

- `environment.*.ts` → `siteUrl`
- `src/index.html` (canonical, og:url, og:image)
- `public/robots.txt` y `public/sitemap.xml`

---

## Prueba manual post-deploy (~10 min)

1. Incógnito: enviar formulario de **contacto** → debe guardar; no debe poder listar `contacts`.
2. Incógnito: solicitar **cita** → éxito; calendario muestra franja ocupada; no listar `appointments`.
3. Incógnito: intentar crear documento en `tattooTouristCities` (SDK consola) → **denegado**.
4. Login admin → dashboard, citas, blog, Tattourism CRUD.
5. Login con otra cuenta Firebase (si existiera) → rechazado en login y rutas admin.
6. `https://stiven7ink.web.app/robots.txt` y `/sitemap.xml` responden 200.

---

## Riesgos residuales (post-lanzamiento — Fase 4)

| Riesgo | Mitigación futura |
|--------|-------------------|
| Spam de `busySlots` sin cita real | reCAPTCHA en citas; o Cloud Function que cree slot solo con cita válida |
| Subidas a `appointments/` Storage sin cita | CAPTCHA; límites por IP (Cloud Functions) |
| Admin por email en reglas | Custom claims `admin: true` |
| API key en cliente | Restricción HTTP referrer en Google Cloud Console |
| Panel `/admin/login` descubrible | URL no obvia; sin enlaces en prod (ya hecho) |

---

## Definition of Done (go-live)

- [x] Reglas repo: tattooTourist solo admin; isAdmin en datos sensibles
- [ ] Reglas **desplegadas** en Firebase producción
- [ ] Solo cuenta(s) admin en Auth
- [ ] `npm run build:prod` sin errores
- [ ] Hosting desplegado
- [ ] robots + sitemap + meta description
- [ ] Search Console + sitemap enviado
- [ ] Enlaces desde redes al sitio
