# Arquitectura del Sistema: El Buen Corte 🏗️

Este documento describe la estructura técnica y el flujo de datos de la plataforma.

## Stack Tecnológico 💻

- **Framework**: Next.js 15 (App Router).
- **Runtime**: Node.js & Edge Runtime (Middleware).
- **Base de Datos**: Firebase Firestore.
- **Autenticación**: Firebase Auth (Custom Claims para RBAC).
- **Optimización & Seguridad**: Upstash Redis (Rate Limiting distribuido).
- **Estilos**: Vanilla CSS & Tailwind CSS.

## Flujo de Datos 🔄

1.  **Cliente**: El usuario realiza un pedido a través de `OrderFormModal`.
2.  **Validación & Sanitización**: Los datos pasan por `validateAndSanitize` (Zod + Sanitizer) antes de enviarse a la API.
3.  **API (Edge/Server)**:
    - Verificación de Rate Limit (Redis).
    - Verificación de Autenticación (Firebase Admin).
    - Validación de Reglas de Negocio (Stock, Precios).
4.  **Firestore**: Escritura protegida por `firestore.rules`.
5.  **Eventos**: Los cambios disparan `processOrderEvent` para auditoría y logs.

## Componentes Críticos 🛡️

- **`src/lib/auth-server.ts`**: Centraliza la validación de roles y sesiones.
- **`src/middleware.ts`**: Aplica headers OWASP y rate limiting global.
- **`src/lib/ratelimit.ts`**: Gestiona la persistencia de cuotas de acceso.

---
> [!NOTE]
> La arquitectura está diseñada para ser "Edge-ready" y soportar múltiples negocios (Multi-tenant) mediante el campo `tenantId`.
