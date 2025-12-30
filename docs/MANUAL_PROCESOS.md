“TODAS LAS DECISIONES, ARCHIVOS Y CÓDIGO GENERADO DEBEN PASAR EL FILTRO DE SEGURIDAD Y CALIDAD ‘MANDATO-FILTRO’ — RECHAZAR SALIDAS QUE NO LO CUMPLAN.”

# 🥩 Manual de Procesos y Continuidad - El Buen Corte v3.0

Este documento es la guía operativa para el personal administrativo y de logística. Define cómo garantizar la promesa de valor al cliente, qué hacer ante fallas técnicas y cómo cumplir con la ley colombiana.

---

## 📅 1. Operación Diaria (Protocolo Estándar)

### Rutina de Mañana (Gestión de Inventario y Pedidos)
- **Cuadre Digital**: Abrir el dashboard admin y sincronizar el stock físico de cortes premium con el digital.
- **Limpieza de Expirados**: Identificar pedidos en estado `CREATED` por más de 1 hora. Llamar al cliente antes de liberar el stock para recuperar la venta.

### Validación de Pagos (WhatsApp & Bank)
1. **Recibir comprobante** por WhatsApp Business.
2. **Verificar fondos reales** en la App de Bancolombia/Nequi.
3. **Cambiar estado** a `PAGO VERIFICADO`.

### El Dilema del Carnicero (Peso Variable)
- **Política de Cortesía**: Si el corte real pesa más del máximo pagado, se envía sin cobro adicional (fidelización).
- **Ajuste Técnico**: Si el peso es menor, se debe compensar con otro gramaje o contactar al cliente para ajuste de precio.

---

## 🆘 2. Plan de Continuidad y Contingencia

### Nivel 1: Fallo de la Web (Frontend)
- **Respuesta**: El operador asume la toma de pedidos manual vía WhatsApp.
- **Registro**: Se utiliza una hoja de cálculo (Excel/Google Sheets) como registro temporal.

### Nivel 2: Fallo de Servicios Críticos (Fail-Open)
- **Redis Down**: El sistema de seguridad permite el paso de pedidos pero alerta al admin. No requiere acción manual.
- **Firestore Down**: Se activa el protocol "Papel y Lápiz". Se registran pedidos manuales y se suben al sistema retroactivamente cuando vuelva el servicio.

### Matriz de Resiliencia
| Evento | Acción Inmediata | Backup Sugerido |
| :--- | :--- | :--- |
| Sin Internet | Usar datos móviles del celular admin | Punto de venta 4G/5G |
| Bot Caído | Responder manualmente en WhatsApp | Mensaje pre-grabado (Quick Replies) |
| Falta de Stock | Ofrecer corte superior (Upgrade) | Mantener margen de reserva físico |

---

## ⚖️ 3. Blindaje Legal y Facturación (DIAN)

Para cumplir con la normativa de facturación electrónica en Colombia:
1. **Recolección de Datos**: El sistema captura NIT, Razón Social y Email automáticamente.
2. **Factura Individual**: Debe emitirse en los siguientes 2 días hábiles (vía Proveedor Tecnológico).
3. **Factura Global**: Al final del día, todas las ventas que no solicitaron factura explícita deben consolidarse en una factura global diaria.

> [!IMPORTANT]
> El cumplimiento legal es responsabilidad compartida entre el software (recolección) y el contable (reporte DIAN).

---

## 📈 4. Hoja de Ruta (Crecimiento Estratégico)

- **Fase 1 (Actual)**: Operación optimizada, seguridad Hardened, analítica de cohortes activa.
- **Fase 2 (Próxima)**: Notificaciones Push (PWA), automatización total de emails transaccionales.
- **Fase 3 (Visión)**: Inteligencia Artificial para predicción de demanda basada en historial de ventas.

---

*Gerencia de Operaciones - El Buen Corte - 2025*
