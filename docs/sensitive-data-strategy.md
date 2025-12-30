# 🔐 Estrategia de Datos Sensibles - BuenCorte

## ❌ ERROR COMÚN: Número de teléfono en `.env`

**NO PONGAS datos de contacto público en `.env`**

### ¿Qué va en `.env`? (SOLO secretos)
```bash
# ✅ CORRECTO - Secretos que NUNCA se muestran
FIREBASE_PROJECT_ID=xxxxx
FIREBASE_CLIENT_EMAIL=xxxxx@xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nXXXXX..."
REDIS_URL=redis://user:password@host:6379
CLOUDINARY_API_SECRET=xxxxxx
RECAPTCHA_SECRET_KEY=6Ld...

# ❌ INCORRECTO - Datos públicos NO van aquí
CONTACT_PHONE=+57 300 123 4567  # Esto NO va en .env
CONTACT_ADDRESS="Calle 123 #45-67"  # Esto NO va en .env
```

---

## ✅ ESTRATEGIA CORRECTA

### 1. **Datos Públicos de Contacto** → Firestore

**Dónde**: `general_config/settings`

```typescript
{
  contactPhone: "+57 320 999 8888",
  contactAddress: "AV 1D # 27 - 29 Virgilio Barco",
  contactEmail: "ventas@buencorte.co",
  instagramUrl: "https://instagram.com/buencorte",
  // ... otros datos públicos
}
```

**Por qué Firestore**:
- ✅ Admin puede cambiarlos desde `/admin/settings`
- ✅ Se actualizan en tiempo real (sin redeploy)
- ✅ Visible para usuarios (ES CORRECTO que lo vean)
- ✅ Respaldo automático
- ✅ Historial de cambios

**Flujo**:
```
Admin cambia teléfono en /admin/settings
    ↓
Firestore: general_config/settings actualizado
    ↓
useConfig() detecta cambio (onSnapshot)
    ↓
Footer se actualiza INSTANTÁNEAMENTE
    ↓
Usuarios ven nuevo teléfono
```

---

### 2. **Secretos (API Keys, Passwords)** → `.env`

**Solo para**:
- API keys privadas (Cloudinary, Firebase Admin, etc.)
- Passwords de bases de datos
- Tokens de autenticación
- Secrets de servicios externos

**Nunca accesibles desde el frontend**

---

### 3. **Configuración Técnica** → `next.config.js`

```javascript
// Para configuraciones de build/compilación
module.exports = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  },
};
```

---

## 🔍 TU CASO ESPECÍFICO

### Pregunta: "¿De qué sirve el número con hash en .env si lo muestro en la interfaz?"

**Respuesta**: NO debes hashear el número de teléfono. Y NO debe estar en `.env`.

### Solución:

#### ❌ ANTES (Incorrecto)
```bash
# .env
CONTACT_PHONE_HASH=a5b3c2d1e... # Hash del teléfono
```
```tsx
// Frontend
<span>{process.env.CONTACT_PHONE_HASH}</span> ❌
```

**Problema**: 
- Si hasheas el número, NO puedes mostrarlo
- Si lo muestras, NO tiene sentido hashearlo
- Además, `.env` NO es para datos públicos

---

#### ✅ AHORA (Correcto)
```typescript
// Firestore: general_config/settings
{
  contactPhone: "+57 320 999 8888",  // SIN hashear, es dato PÚBLICO
  contactAddress: "AV 1D # 27 - 29 Virgilio Barco"
}
```

```tsx
// Frontend - src/components/FooterConfigLoader.tsx
const { config } = useConfig();  // Lee de Firestore

<span>{config.contactPhone}</span>  // ✅ Muestra directo
```

---

## 🛡️ Protección contra Abuso

### ¿Cómo proteger el número sin ocultarlo?

1. **Rate Limiting** (Ya implementado en tu app)
   - Limita clicks en botón "Llamar"
   - Limita envíos de formularios
   - Middleware detecta abuso

2. **Bot Detection**
   - reCAPTCHA en formularios
   - Honeypots

3. **Monitoreo**
   - Analytics de uso
   - Alertas si hay picos anormales

4. **No Mostrar en HTML Plano** (opcional)
   ```tsx
   // En lugar de:
   <a href="tel:+573209998888">+57 320 999 8888</a>
   
   // Puedes usar:
   <button onClick={() => window.location.href = 'tel:+573209998888'}>
     Llamar
   </button>
   ```

---

## 📊 Comparación Final

| Tipo de Dato | Ubicación | ¿Visible público? | Ejemplo |
|--------------|-----------|-------------------|---------|
| **Contacto público** | Firestore | ✅ Sí | Teléfono, dirección, email |
| **Secretos** | `.env` | ❌ No | API keys, passwords |
| **Config build** | `next.config.js` | ⚠️ Partial | Dominios permitidos, rewrites |
| **Constantes app** | Código TS | ✅ Sí | Límites, defaults |

---

## ✅ RESUMEN

1. **Teléfono, dirección, redes sociales** → Firestore (`general_config/settings`)
2. **NO hashear datos públicos** (no tiene sentido)
3. **Admin cambia desde `/admin/settings`** → Footer se actualiza en tiempo real
4. **Protección**: Rate limiting + reCAPTCHA (no ocultación)
5. **`.env` solo para secretos** que nunca se muestran al usuario

**Tu número de teléfono DEBE ser visible. Es para que clientes te contacten.**
