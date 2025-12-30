# Seguridad de Datos y Accesos (RBAC) 🔐

El Buen Corte utiliza una arquitectura de seguridad por capas (Defensa en Profundidad).

## Capas de Seguridad 🛡️

### 1. Perímetro (Middleware)
- **Rate Limiting**: Doble capa (Local & Upstash Redis) para prevenir ataques brute-force y DoS.
- **Headers OWASP**: CSP estricta, HSTS, X-Frame-Options para prevenir XSS y Clickjacking.

### 2. Capa de Aplicación (API)
- **Validación Zod**: Esquemas estrictos para cada entrada.
- **Sanitización Proactiva**: Escapado de entidades HTML en todos los campos de texto (`src/lib/sanitize.ts`).
- **RBAC**: Control de acceso basado en roles (`user`, `staff`, `admin`) vía Firebase Custom Claims.

### 3. Capa de Datos (Firestore)
- **Reglas de Seguridad**: Política de "Denegar por Defecto".
- **Aislamiento Multi-tenant**: Función `hasTenantAccess` para asegurar que nadie lea datos de otro negocio.
- **Restricciones Temporales**: Bloqueo de escrituras automáticas fuera de ventanas de tiempo permitidas.

## Auditoría 📝
- Todos los eventos críticos (creación de órdenes, cambios de estado, accesos fallidos) se registran en la colección `/logs` con el IP y Correlation ID correspondientes.

---
> [!IMPORTANT]
> Nunca use credenciales administrativas en el cliente. Use siempre el SDK de administración en rutas del servidor protegidas.
