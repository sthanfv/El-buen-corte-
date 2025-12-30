# 🔧 DIAGNÓSTICO: Config Sync & SalesBot Status

## ❌ PROBLEMA ENCONTRADO: Footer Config No Sincroniza

### Root Cause
**Path inconsistency entre Admin y Frontend:**
- **Admin Settings API** (`/api/admin/system/settings`): Escribe a `system_settings/global`
- **useConfig Hook**: Lee desde `general_config/settings`

**Resultado**: Cambios en Admin se guardan en una colección diferente que el Footer nunca lee.

---

## ✅ SOLUCIÓN APLICADA

### 1. Unified Firestore Path
- **Path estándar**: `general_config/settings` (usado por `useConfig`)
- Eliminado conflicto con `system_settings/global`

### 2. New API Endpoint
**File**: `src/app/api/config/route.ts`
- `GET /api/config`: Lee configuración global
- `POST /api/config`: Actualiza configuración (con validación Zod)

### 3. Enhanced useConfig Hook
**File**: `src/lib/config.ts`
- Añadidos logs de debugging (`console.log`)
- Usa `merge: true` en `setDoc` para updates parciales
- Subscription en tiempo real vía `onSnapshot`

---

## 🤖 SALESBOT V2 STATUS

### ✅ Funcionando Correctamente
- **Feature Flag**: `salesBotV2: true` (habilitado)
- **Engine**: `SalesBotEngine` inicializado correctamente
- **Triggers**:
  - Visitante recurrente (1-7 días)
  - Tiempo en página > 10s
  - Evaluación cada 7 segundos
- **Actions**: Add to cart, Checkout, Navigation

### 📊 Capabilities
- Trackea productos vistos
- Monitorea valor del carrito
- Contexto de navegación
- Auto-dismiss 12s
- Logging de eventos

---

## 🔥 TESTING INSTRUCTIONS

### Test 1: Footer Config Sync
1. Go to `/admin/settings`
2. Change "Teléfono" from default to `+57 320 999 8888`
3. Click "Guardar Configuración"
4. **Check Footer** → Debe actualizarse instantáneamente (onSnapshot)

### Test 2: SalesBot Trigger
1. Open homepage
2. Wait 10 seconds without interaction
3. **Expected**: Bot appears with welcome message
4. Browse products → Bot should react to cart changes

---

## 🛡️ MANDATO-FILTRO COMPLIANCE

| Check | Status | Notes |
|:------|:------:|:------|
| No hardcoded secrets | ✅ | Firestore paths in constants |
| Input validation | ✅ | Zod schema on ConfigData |
| Error handling | ✅ | Try-catch + typed errors |
| Real-time sync | ✅ | onSnapshot listener |
| RBAC ready | ⚠️ | `/api/config` POST sin auth (temporal) |

> **NOTE**: El endpoint `/api/config POST` debe protegerse con RBAC en producción.
