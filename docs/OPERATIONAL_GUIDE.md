# 📋 Guía Operativa Diaria - El Buen Corte

Esta guía describe el flujo de trabajo diario para operar El Buen Corte de manera eficiente y profesional.

**Última Actualización**: 19 de Diciembre de 2024  
**Versión**: 2.0

---

## 🌅 Flujo de Trabajo Diario

### 1️⃣ RECEPCIÓN DE PEDIDOS (Automático - 24/7)

**¿Qué sucede?**
- Los clientes realizan pedidos desde la web
- Los pedidos se guardan automáticamente en Firebase
- Estado inicial: `CREATED`
- **El cliente recibe un modal de confirmación con**:
  - Referencia de Pago: `#ORD-XXXX`
  - **Botón grande de WhatsApp** para confirmar pago
  - Advertencia de 1 hora para confirmar

**Número de WhatsApp Configurado**: `+57 311 311 4357`

**Ejemplo de Referencia**: `#ORD-A1B2C3D4`

---

### 2️⃣ VERIFICACIÓN DE PAGOS (Manual - Cada 1-2 horas)

**Horarios recomendados**: 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM, 6:00 PM

#### Paso a Paso:

1. **Abrir WhatsApp Business** (`+57 311 311 4357`)
   - Revisa los mensajes con comprobantes de pago
   - Los clientes enviarán un mensaje pre-llenado como:
   ```
   🥩 ¡Hola El Buen Corte!
   
   Acabo de hacer el pedido: *#ORD-A1B2C3D4*
   Total a pagar: *$125,000*
   
   Quedo atento para enviar el comprobante de pago.
   ```

2. **Ir al Panel Admin**
   - Navega a: `https://tudominio.com/admin/orders`
   - **IMPORTANTE**: El admin ahora muestra datos en tiempo real (SSR forzado)
   - Usa el buscador para encontrar el pedido por referencia

3. **Verificar el Pago**
   - Compara el monto del comprobante con el total del pedido
   - Si coincide, cambia el estado a: `CONFIRMED`
   - Si no coincide, contacta al cliente por WhatsApp

4. **Registrar Datos de Pago** (Opcional)
   - Código de transacción (campo en Admin)
   - Método de pago (Nequi, Bancolombia, etc.)

**⚠️ REGLA DE ORO**: No se corta carne hasta que el pedido esté en `CONFIRMED`

**⏱️ URGENCIA**: Los pedidos tienen 1 hora para confirmar pago, después el stock se libera automáticamente

---

### 3️⃣ CORTE Y PREPARACIÓN (Operativo)

**Horarios de corte**: Según ventanas de entrega

#### Ventanas de Entrega:

| Pedidos antes de | Salen a las | Entrega |
|------------------|-------------|---------|
| 11:00 AM | 1:00 PM | Mismo día tarde |
| 4:00 PM | 6:00 PM | Mismo día noche o día siguiente |

#### Proceso de Corte:

1. **Filtrar Pedidos Confirmados**
   - En Admin, filtra por estado: `CONFIRMED`
   - Ordena por hora de confirmación

2. **Cortar Según Especificaciones**
   - **Productos de Peso Variable**: Busca el rango (ej: 900g - 1.1kg)
   - **Regla del Cliente Nunca Pierde**:
     - ✅ Si sale 950g (dentro del rango): Perfecto
     - ✅ Si sale 1.2kg (más del máximo): Se envía igual (regalo)
     - ❌ Si sale 850g (menos del mínimo): Completa con retazo o corta otra pieza

3. **Empacar y Etiquetar**
   - Empaque al vacío
   - Etiqueta con: Nombre del cliente, Referencia del pedido, Producto

4. **Cambiar Estado**
   - En Admin, cambia el pedido a: `PACKING`

---

### 4️⃣ GENERACIÓN DE RUTA (Batch - 12:00 PM y 5:00 PM)

#### Paso a Paso:

1. **Ir a Admin Orders**
   - Filtra por estado: `PACKING`

2. **Generar Ruta para WhatsApp**
   - Clic en botón: **"Generar Ruta WhatsApp"** (próximamente)
   - O usa el endpoint: `POST /api/admin/generate-route`
   - El sistema genera un texto formateado

3. **Copiar y Enviar al Mensajero**
   - El texto se copia automáticamente al portapapeles
   - Pégalo en WhatsApp del mensajero

**Ejemplo de Texto Generado**:

```
📅 RUTA DE LA TARDE - 19 DIC
===================================
📦 PARADA 1: Juan Pérez
📍 Dirección: Calle 123 #45-67, Apto 202
🏘️ Barrio: Chapinero
🏙️ Ciudad: Bogotá
📞 Tel: 3001234567
💰 COBRAR: $0 (Ya pagado)
📝 Notas: Dejar en portería

-----------------------------------
📦 PARADA 2: María García
📍 Dirección: Carrera 7 #80-45
🏘️ Barrio: Usaquén
🏙️ Ciudad: Bogotá
📞 Tel: 3109876543
💰 COBRAR: $85,000 (Contraentrega)
📝 Notas: Llamar al llegar

-----------------------------------
📊 RESUMEN DE RUTA
Total paradas: 2
Total a cobrar: $85,000

✅ ¡Buena ruta! 🚴‍♂️
```

4. **Cambiar Estado de Pedidos**
   - Selecciona todos los pedidos de la ruta
   - Cambia estado a: `ROUTING`
   - El cliente recibe email automático: "Tu pedido salió a ruta"

---

### 5️⃣ ENTREGA Y CIERRE

#### Cuando el Mensajero Entrega:

1. **Confirmar Entrega**
   - El mensajero te confirma por WhatsApp
   - En Admin, cambia el pedido a: `DELIVERED`

2. **Registrar Dinero Recibido** (Si fue contraentrega)
   - Anota el monto recibido
   - Cuadra caja al final del día

---

### 6️⃣ FACTURACIÓN (Fin del Día)

#### Pedidos que NO requieren factura:

- **Acción**: Hacer una **Factura Global** al final del día
- **Cliente**: Consumidor Final (NIT: 222222222222)
- **Monto**: Suma de todas las ventas del día sin factura específica

#### Pedidos que SÍ requieren factura:

- **Identificación**: En Admin, verás un ícono 📄 en pedidos con `requiresInvoice: true`
- **Datos**: NIT, Razón Social, Email de facturación
- **Acción**: Generar factura individual en portal DIAN o tu proveedor
- **Plazo**: Máximo 48 horas después de la entrega

---

## 🎯 Resumen del Día

### Checklist Diario:

- [ ] **9:00 AM**: Primera verificación de pagos en WhatsApp
- [ ] **11:00 AM**: Corte para ruta de la tarde
- [ ] **12:00 PM**: Generar ruta y despachar
- [ ] **2:00 PM**: Segunda verificación de pagos
- [ ] **4:00 PM**: Corte para ruta de la noche
- [ ] **5:00 PM**: Generar ruta y despachar
- [ ] **8:00 PM**: Confirmar entregas del día
- [ ] **9:00 PM**: Cuadre de caja y facturación global

---

## 🚨 Situaciones Especiales

### Cliente No Responde al Mensajero

1. Mensajero llama 2 veces
2. Si no responde, envía WhatsApp
3. Espera 15 minutos
4. Si no hay respuesta, regresa el pedido
5. En Admin, cambia estado a: `PENDING_VERIFICATION`
6. Contacta al cliente para reagendar

### Producto Agotado Después de Confirmar Pago

1. Contacta al cliente inmediatamente
2. Ofrece alternativas:
   - Producto similar
   - Reembolso completo
   - Crédito para próxima compra
3. Documenta en notas del pedido

### Error en el Corte (Muy Poco Peso)

1. **Si es menos del mínimo garantizado**:
   - Completa con un retazo de cortesía
   - O corta otra pieza
   - Nunca envíes menos del mínimo

2. **Si es mucho más del máximo**:
   - Envía igual (el cliente queda feliz)
   - El precio ya incluye margen para esto

### Cliente No Confirma Pago en 1 Hora

1. El sistema libera el stock automáticamente
2. Envía mensaje de WhatsApp recordatorio:
   ```
   Hola! Tu pedido #ORD-XXXX está reservado pero aún no hemos recibido tu comprobante de pago.
   
   Si aún quieres tu pedido, por favor envía tu comprobante lo antes posible.
   
   Si no, el pedido será cancelado automáticamente.
   ```

---

## 📞 Contactos de Emergencia

- **WhatsApp Ventas**: +57 311 311 4357
- **Soporte Técnico**: [Tu email o WhatsApp]
- **Mensajero Principal**: [Número]
- **Mensajero Backup**: [Número]
- **Proveedor de Carne**: [Número]

---

## 🔐 Seguridad y Privacidad

- ✅ Nunca compartas datos de clientes
- ✅ No tomes fotos de comprobantes de pago
- ✅ Elimina mensajes con datos sensibles después de verificar
- ✅ Usa WhatsApp Business, no personal
- ✅ Cierra sesión del Admin si dejas el computador
- ✅ El admin ahora muestra datos en tiempo real (no refresques manualmente)

---

## 💡 Mejoras Recientes (19 Dic 2024)

### ✅ Admin en Tiempo Real
- Las páginas admin ahora usan SSR (Server-Side Rendering)
- Los datos se actualizan automáticamente sin necesidad de refrescar
- No más "Admin Fantasma" con datos viejos

### ✅ Checkout Mejorado
- Modal de confirmación con CTA de WhatsApp
- Mensaje pre-llenado para el cliente
- Urgencia de 1 hora para confirmar pago
- Referencia de pedido visible (#ORD-XXXX)

### ✅ Errores Amigables
- Todos los errores ahora muestran mensajes claros en español
- Indicaciones de qué hacer a continuación
- Sin jerga técnica

---

**Última actualización**: 19 de Diciembre de 2024  
**Versión**: 2.0  
**Próxima revisión**: 19 de Enero de 2025
