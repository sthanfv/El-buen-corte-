# 🥩 El Buen Corte - Plataforma Digital de Carnes Premium

![Banner Principal](https://picsum.photos/seed/buencorte-hero/1200/400)

> **La experiencia del mejor steakhouse, directamente a tu parrilla.**
> *Infraestructura digital para la gestión, venta y logística de cortes premium madurados.*

## 🚀 Visión del Producto

"El Buen Corte" no es solo un e-commerce. Es una **solución tecnológica integral** diseñada para digitalizar la cadena de valor de una carnicería boutique. Elimina la fricción entre el deseo del cliente y la logística de entrega, centralizando pedidos, inventario y fidelización en una plataforma robusta y escalable.

### Propuesta de Valor
- **Catálogo Vivo:** Stock en tiempo real sincronizado con inventario físico.
- **Sin Fricción:** Pedidos optimizados para WhatsApp (canal preferido en LatAm).
- **Gestión Total:** Panel administrativo para control de cortes, precios y estados de pedidos.
- **Traza & Confianza:** Información detallada de origen, maduración y maridaje.

---

## 🛠️ Stack Tecnológico (Modern & Scalable)

Construido sobre una arquitectura **Serverless** y **Edge-First** para máxima velocidad y menor costo operativo.

- **Frontend:** [Next.js 16](https://nextjs.org/) (App Router, Server Components) + [React 19](https://react.dev/).
- **UI System:** [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/) + Framer Motion.
- **Backend/DB:** [Firebase](https://firebase.google.com/) (Auth, Firestore, Cloud Functions).
- **Seguridad:** [Upstash Redis](https://upstash.com/) (Rate Limiting) + Zod Valdiation + Middleware Edge.
- **Infraestructura:** Despliegue en [Vercel](https://vercel.com/).

---

## 📂 Estructura de Documentación

Para auditores técnicos e inversores, hemos preparado documentación detallada:

- **[Arquitectura del Sistema](docs/ARCHITECTURE.md):** Diagramas y flujo de datos.
- **[Documentación Técnica](docs/TECHNICAL_DOCUMENTATION.md):** Guía profunda de implementación.
- **[Guía de Operaciones](docs/OPERATIONAL_GUIDE.md):** Manual para administradores y staff.
- **[Reporte de Seguridad](docs/security_report_final.md):** Auditoría, headers y mitigación de riesgos.
- **[Blueprint de Ingeniería](docs/engineering_blueprint.md):** Decisiones de diseño y patrones.

---

## ⚡ Quick Start (Desarrollo)

### Prerrequisitos
- Node.js 20+
- Cuenta en Firebase y Vercel

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/sthanfv/El-buen-corte-.git

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env
# (Rellenar credenciales de Firebase y Upstash)

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Comandos Clave

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia entorno local con Turbopack. |
| `npm run build` | Compila para producción. |
| `npm test` | Ejecuta suite de pruebas unitarias. |
| `npm run lint` | Análisis estático de código. |

---

## 🛡️ Estado del Proyecto

[![CI Pipeline](https://github.com/sthanfv/El-buen-corte-/actions/workflows/ci.yml/badge.svg)](https://github.com/sthanfv/El-buen-corte-/actions/workflows/ci.yml)
[![Security Status](https://img.shields.io/badge/Security-Audited-green)](docs/security_report_final.md)
[![Uptime](https://img.shields.io/badge/Uptime-99.9%25-blue)](https://vercel.com)

El sistema se encuentra en fase **Production Ready**. Todos los módulos críticos (Auth, Pagos, Inventario) han sido auditados y verificados.

---

> *Desarrollado con ❤️ para los amantes de la carne.*
