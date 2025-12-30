# Guía de Despliegue y Configuración 🚀

Este documento detalla los pasos para poner en producción el sistema.

## Infraestructura Necesaria 🏗️

1.  **Vercel / Next.js**: Para el hospedaje de la aplicación y el Edge Runtime.
2.  **Firebase Project**:
    - Firestore habilitado.
    - Authentication (Firebase Auth) habilitado con Custom Claims.
    - Reglas de seguridad aplicadas desde `firebase/firestore.rules`.
3.  **Upstash Redis**: Para el rate limiting distribuido.
4.  **Sentry**: Para el monitoreo de errores y alertas críticas.

## Variables de Entorno (.env) 🔑

Revise `src/lib/env.ts` para la lista completa de variables validadas:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN` (Opcional, pero recomendado para Phase 5)

## Pasos de Despliegue 📋

1.  **Instalación**: `npm install --legacy-peer-deps`.
2.  **Verificación Pre-vuelo**: `npm run typecheck && npm run lint && npm run test`.
3.  **Construcción**: `npm run build`.
4.  **Despliegue**: Sincronize con Vercel.

---
> [!TIP]
> Use el script `src/scripts/setUserRole.ts` para asignar los primeros roles de administrador después del despliegue inicial.
