# Protocolo de Respuesta ante Incidentes 🚨

Guía de acción para mantener la estabilidad operativa bajo presión.

## Clasificación de Incidentes 📊

### Nivel 1: Operacional (Bajo Impacto)
- *Ejemplo*: Error en la visualización de un producto.
- *Acción*: Corregir y desplegar en la siguiente ventana de mantenimiento.

### Nivel 2: Degradación (Impacto Medio)
- *Ejemplo*: Fallo en la persistencia de logs o latencia alta en Redis.
- *Acción*: Revisar cuotas de Upstash/Firebase y notificar al equipo técnico. El sistema debe operar en "Fail-Open" si es posible.

### Nivel 3: Emergencia (Alto Impacto)
- *Ejemplo*: Brecha de seguridad detectada, pérdida de datos o error 500 masivo en pedidos.
- *Acción*:
    1.  **Activar Modo Emergencia**: Bloquear escrituras en la base de datos si es necesario.
    2.  **Revisar Logs**: Filtrar por `level == "CRITICAL"` en Google Cloud / Firestore Logs.
    3.  **Aislar**: Identificar el IP o Correlation ID del atacante o fallo.
    4.  **Corregir**: Parchear y verificar con la suite de tests.
    5.  **Documentar**: Registrar causa raíz y lecciones aprendidas en este documento.

## Contactos de Emergencia 📞
- Administrador Principal
- Soporte Firebase / Google Cloud
- Dev-on-call

---
> [!CAUTION]
> En caso de ataque DoS detectado por el logger (50+ bloqueos en 1 min), el Middleware escalará automáticamente el bloqueo vía Redis.
