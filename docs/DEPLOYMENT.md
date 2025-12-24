# 🚀 Guía de Despliegue en Producción

Este documento detalla, paso a paso, cómo llevar "El Buen Corte" a producción de manera segura y escalable.

## 1. Arquitectura de Despliegue

El sistema utiliza una arquitectura **Serverless** distribuida:
- **Frontend & Edge Comput:** Vercel (Next.js App Router).
- **Base de Datos & Auth:** Firebase (Google Cloud Platform).
- **Rate Limiting:** Upstash Redis.
- **Almacenamiento:** Vercel Blob / Cloudinary.

## 2. Configuración de Firebase

1. **Crear Proyecto:** Ir a [Firebase Console](https://console.firebase.google.com/) y crear un nuevo proyecto.
2. **Habilitar Servicios:**
   - **Authentication:** Activar Email/Password y Google Provider.
   - **Firestore:** Crear base de datos en modo producción. Configurar reglas (ver `firestore.rules`).
   - **Storage:** Habilitar almacenamiento si se usa (opcional si se usa Vercel Blob).
3. **Generar Credenciales:**
   - Ir a *Configuración del Proyecto* -> *Cuentas de Servicio*.
   - Generar nueva clave privada. Descargar el JSON.
   - **IMPORTANTE:** Extraer `project_id`, `client_email` y `private_key` del JSON.

## 3. Configuración de Upstash Redis (Rate Limiting)

El middleware usa Redis para bloquear ataques DDoS y spam.

1. Crear cuenta en [Upstash](https://upstash.com/).
2. Crear nueva base de datos Redis.
3. Copiar las credenciales `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` de la sección "REST API".

## 4. Despliegue en Vercel

### Paso 1: Conexión con GitHub
- Importar el repositorio desde el Dashboard de Vercel.
- Framework Preset: **Next.js**.

### Paso 2: Variables de Entorno (Environment Variables)

Configurar las siguientes variables en Vercel (Production & Preview):

| Variable | Descripción | Ejemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Key pública de Firebase | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de Auth | `project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto | `el-buen-corte-prod` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de Storage | `project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | `123456...` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | `1:123...:web:...` |
| `FIREBASE_ADMIN_PROJECT_ID` | ID Admin (igual al público) | `el-buen-corte-prod` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Email de Service Account | `firebase-adminsdk...` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Clave Privada (**Con saltos de línea**) | `-----BEGIN PRIVATE KEY...` |
| `UPSTASH_REDIS_REST_URL` | URL de Redis | `https://fitting-husky...` |
| `UPSTASH_REDIS_REST_TOKEN` | Token de Redis | `Awer...` |
| `BLOB_READ_WRITE_TOKEN` | Token de Vercel Blob | `vercel_blob_rw_...` |
| `NEXT_PUBLIC_ADMIN_EMAILS` | Coma-separada de emails admin (Legacy) | `admin@buencorte.co` |
| `NEXT_PUBLIC_ADMIN_UID` | UID del Super Admin | `pWwqHx...` |

> **Nota:** Para `FIREBASE_ADMIN_PRIVATE_KEY`, asegúrate de copiar todo el contenido, incluyendo `-----BEGIN...` y `-----END...`. Vercel maneja los saltos de línea automáticamente en el dashboard.

### Paso 3: Deploy
- Hacer click en **Deploy**.
- Esperar a que el build finalice. Si hay error 500, verificar variables de entorno.

## 5. Post-Despliegue

### Asignar Roles de Admin
Una vez desplegado, debes asignar el rol de administrador a tu usuario principal.
1. Regístrate en la app pública (`/admin/login` -> aunque no habrá botón de registro, el usuario debe existir en Auth).
2. Ejecuta el script localmente:
   ```bash
   node src/setAdmin.js <TU_UID>
   ```
3. Verifica el acceso en `/admin/dashboard`.

### Monitoreo
- **Sentry**: (Opcional) Configurar `SENTRY_DSN` para trazas de errores.
- **Vercel Analytics**: Habilitar en el dashboard para métricas de tráfico.

---

**Estado del Despliegue:** 🟢 Production Ready
**Última Verificación:** 24 de Diciembre, 2025.
