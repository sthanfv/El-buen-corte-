# Checklist Final de Despliegue 🚀

Este documento separa las tareas completadas técnicamente de las acciones manuales que debes realizar para finalizar el lanzamiento.

## ✅ Tareas Completadas (IA)

- [x] **Infraestructura SEO**: Creados `robots.txt` y `sitemap.xml` en la carpeta `/public`.
- [x] **PWA / Mobile**: Creado `site.webmanifest` para compatibilidad con Android/iOS.
- [x] **Metadata Layout**: Integrados los links de favicons, manifest y Open Graph en `src/app/layout.tsx`.
- [x] **Hardening**: Sistema blindado con Phase 1-5 (Seguridad, Roles, Performance).

---

## 🛠️ Acciones Requeridas (USUARIO)

### 1. Carga de Imágenes en `/public`
Debes subir los siguientes archivos a la carpeta `public/` de tu proyecto (asegúrate de que los nombres coincidan exactamente):

| Archivo | Dimensión Recomendada | Propósito |
| :--- | :--- | :--- |
| `favicon.ico` | 32x32px | Icono de pestaña (Browser) |
| `apple-touch-icon.png` | 180x180px | Icono para iPhone/iPad |
| `android-chrome-192x192.png` | 192x192px | Icono PWA (Android) |
| `android-chrome-512x512.png` | 512x512px | Icono PWA Splash |
| `og-image.jpg` | 1200x630px | Vista previa en WhatsApp/Facebook |

> [!TIP]
> Mantén el peso de las imágenes por debajo de 150KB para una carga ultra rápida.

### 2. Configuración en Google Search Console
1. Entra a [Google Search Console](https://search.google.com/search-console).
2. Añade tu dominio (ej: `elbuencorte.co`).
3. Verifica la propiedad (usando DNS o subiendo el archivo HTML que te den a `/public`).
4. Ve a la sección **Sitemaps** y envía la URL: `https://TU_DOMINIO/sitemap.xml`.

### 3. Ajuste de Dominio
He configurado `elbuencorte.co` como placeholder. Si tu dominio real es distinto:
- Actualiza `public/robots.txt` (línea del Sitemap).
- Actualiza `public/sitemap.xml` (etiquetas `<loc>`).
- Actualiza `src/app/layout.tsx` (campo `url` en `openGraph`).

---

## 🟢 Comprobación Final
- [ ] Visita `tu-sitio.com/robots.txt` -> ¿Se ve el texto?
- [ ] Visita `tu-sitio.com/sitemap.xml` -> ¿Se ve el XML?
- [ ] Comparte tu link en WhatsApp -> ¿Aparece la imagen de previsualización (OG)?
- [ ] Añade a pantalla de inicio en Android -> ¿Aparece el icono del manifest?

> [!IMPORTANT]
> Con estas acciones completadas, Google indexará tu sitio correctamente y la experiencia de usuario será de nivel profesional desde el primer día.
