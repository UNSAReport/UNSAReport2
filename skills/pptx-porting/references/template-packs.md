# Arquitectura de Template Packs

Los **Template Packs** (`TemplatePack`) son la unidad canónica y atómica de plantillas en UNSAReport2. Sustituyen el modelo heredado de matriz tema-layout (`supportedThemes` y `showcaseLayouts`) por paquetes autocontenidos que agrupan un tema visual con sus diapositivas especializadas.

---

## 1. Transición desde la Matriz Tema-Layout

| Aspecto | Modelo Anterior (Matriz Tema-Layout) | Nuevo Modelo (Template Packs) |
| :--- | :--- | :--- |
| **Organización** | Layouts globales dispersos con `supportedThemes: ['tema']` y temas con `showcaseLayouts: [...]`. | Paquete atómico y autocontenido en `src/packs/<pack-id>/` (`index.ts`, `theme.ts`, `slides/*.tsx`). |
| **Acoplamiento** | Contaminación del registro global de layouts; colisiones entre slots y estilos específicos. | Encapsulación limpia: el tema y sus slides pertenecen exclusivamente al pack. |
| **Manejo de Assets** | Archivos binarios locales a menudo commiteados en el repositorio o empaquetados en npm. | **Zero Local Binaries**: Assets remotos alojados en SeaweedFS S3 / CDN y referenciados con `getTemplateAssetUrl(packId, filename)`. |
| **Estilos Visuales** | Mezcla de SVGs inline masivos y exportaciones de imágenes raster decorativas. | **CSS-First**: Gradients, blurs, sombras y bordes en CSS puro. Prohibición estricta de SVG inline kilométricos. |

---

## 2. Estructura Canónica de un `TemplatePack`

Cada pack reside en su propio directorio: `packages/slides-kit/src/packs/<pack-id>/`.

```ts
import type { ComponentType } from 'react';
import type { SlotSchema } from '@/layouts/types';
import type { ThemeDefinition } from '@/themes/types';

export interface TemplateSlide {
  /** Identificador único dentro del pack (kebab-case, sin prefijo de pack, ej. 'cover') */
  id: string;
  /** Nombre legible para la UI y selectores */
  name: string;
  /** Descripción del propósito de la slide */
  description: string;
  /** Slots de datos parametrizables que acepta el componente */
  slots: SlotSchema[];
  /** Componente React limpio que renderiza la slide */
  component: ComponentType<any>;
  /** Ruta o URI opcional de la imagen de previsualización */
  thumbnail?: string;
}

export interface TemplatePack {
  /** Identificador único del pack en kebab-case (ej. 'cloudlet-pitch') */
  id: string;
  /** Nombre legible para galerías y selectores */
  name: string;
  /** Descripción y contexto de uso del pack */
  description: string;
  /** Etiquetas para búsqueda y categorización */
  tags: string[];
  /** Definición visual del tema (estilos puros: colores, fuentes, tokens) */
  theme: ThemeDefinition;
  /** Colección de slides de plantilla incluidas en el pack */
  slides: TemplateSlide[];
  /** Miniatura de previsualización del pack */
  thumbnail?: string;
  /** Metadatos de origen */
  meta?: {
    source?: 'pptx' | 'figma' | 'scratch';
    author?: string;
    version?: string;
  };
}
```

---

## 3. Ejemplo de Definición de un Pack (`index.ts`)

```tsx
// packages/slides-kit/src/packs/cloudlet-pitch/index.ts
import type { TemplatePack } from '@/packs/types';
import { cloudletPitchTheme } from './theme';
import { CloudletCover } from './slides/cover';
import { CloudletAgenda } from './slides/agenda';

export const cloudletPitchPack: TemplatePack = {
  id: 'cloudlet-pitch',
  name: 'Cloudlet Pitch',
  description: 'Pitch deck moderno con lavados oscuros y acentos cian.',
  tags: ['pitch', 'startup', 'tech'],
  theme: cloudletPitchTheme,
  meta: { source: 'pptx' },
  slides: [
    {
      id: 'cover',
      name: 'Cloudlet Cover',
      description: 'Portada principal con panel degradado y titular destacado',
      slots: [
        { name: 'brand', type: 'string', required: false, description: 'Marca de la startup' },
        { name: 'heroTitle', type: 'string', required: false, description: 'Titular gigante' },
        { name: 'subtitle', type: 'string', required: false, description: 'Subtítulo' },
      ],
      component: CloudletCover,
    },
    {
      id: 'agenda',
      name: 'Cloudlet Agenda',
      description: 'Agenda con puntos numerados',
      slots: [
        { name: 'title', type: 'string', required: false, description: 'Título de sección' },
        { name: 'items', type: 'array', required: false, description: 'Puntos de agenda' },
      ],
      component: CloudletAgenda,
    },
  ],
};
```

---

## 4. Hosting Remoto y Resolución de Assets (`getTemplateAssetUrl`)

Para evitar inflar el repositorio git y los artefactos distribuidos de `@unsa/slides-kit`, todos los recursos binarios (fotografías, ilustraciones complejas, logos e iconos gráficos) se almacenan remotamente en SeaweedFS S3 / UNSAReport CDN bajo la ruta:

```text
/api/slides/assets/templates/:packId/:filename
```

### Reglas de Assets:
1. **Zero Local Binaries:** Jamás agregues archivos PNG, JPG o WebP pesados al directorio `src/` del repositorio de git ni al paquete npm distribuible.
2. **Helper Canónico:** Para obtener la URL de un asset dentro de un componente de slide, utiliza la función `getTemplateAssetUrl(packId, filename)` provista por `@unsa/slides-kit/packs/assets` (o `../../assets` / `@/packs/assets` dentro del kit).
3. **Inyección en Tiempo de Ejecución:** El helper soporta `window.__UNSA_SLIDES_ASSETS_URL__` o `process.env.VITE_SLIDES_ASSETS_URL`, cayendo por defecto al proxy local `/api/slides/assets/templates`.

### Ejemplo en un Componente de Slide:

```tsx
// packages/slides-kit/src/packs/cloudlet-pitch/slides/cover.tsx
import type { CSSProperties } from 'react';
import { getTemplateAssetUrl } from '@/packs/assets';

// Resolución remota de assets específicos del pack
const logo = getTemplateAssetUrl('cloudlet-pitch', 'asset-b00f7859.webp');
const photo = getTemplateAssetUrl('cloudlet-pitch', 'asset-6a656244.jpg');

export interface CloudletCoverProps {
  brand?: string;
  heroTitle?: string;
  photoSrc?: string;
}

const CONTAINER_STYLE: CSSProperties = {
  position: 'relative',
  width: 1280,
  height: 720,
  overflow: 'hidden',
  background: '#0d1117',
};

export function CloudletCover({
  brand = 'Cloudlet Tech',
  heroTitle = 'Startup Pitch',
  photoSrc = photo,
}: CloudletCoverProps) {
  return (
    <div style={CONTAINER_STYLE}>
      {/* CSS-First: Efectos decorativos con CSS puro, NO imágenes raster ni SVGs */}
      <div
        style={{
          position: 'absolute',
          left: 580,
          top: -50,
          width: 890,
          height: 660,
          background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.25), transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Asset remoto cargado con tag <img> limpio */}
      <img
        src={logo}
        alt="Logo"
        style={{ position: 'absolute', left: 72, top: 48, width: 44, height: 44 }}
      />

      {/* Tipografía y contenido semántico */}
      <h1
        style={{
          position: 'absolute',
          left: 72,
          top: 360,
          fontSize: '120px',
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1.1,
        }}
      >
        {heroTitle}
      </h1>
    </div>
  );
}
```

---

## 5. Higiene TSX y Reglas de Calidad

1. **No Inline SVGs Spaghetti:**
   - Queda terminantemente prohibido pegar bloques de `<svg><path d="M 12.3 45.6 ... Z" /></svg>` masivos en el TSX.
   - Para formas geométricas (rectángulos, divisores, pastillas, discos), utiliza contenedores CSS (`<div>`, `rounded-full`, bordes semánticos).
   - Para iconos complejos que no justifiquen una fuente de iconos, trátalos como imágenes remotas con `getTemplateAssetUrl`.
2. **CSS-First:**
   - Degradados, halos de luz (glows), difuminados (blurs), fondos translúcidos, sombras y bordes deben expresarse en CSS (`linear-gradient`, `radial-gradient`, `box-shadow`, `filter: blur(...)`).
   - Nunca exportes un PNG difuminado para usarlo de fondo cuando una línea de CSS lo reproduce con mayor fidelidad, sin peso y con escalabilidad vectorial.
3. **Cajas Delimitadas:**
   - Todas las diapositivas deben respetar el lienzo canónico de 1280×720 con `overflow: hidden` en el contenedor raíz para garantizar la fidelidad en SSR y exportación PDF.

---

## 6. Registro de Packs en el Catálogo

Para que un nuevo pack esté disponible en todo el sistema:

1. Agrégalo en `packages/slides-kit/src/packs/catalog.ts`:
   ```ts
   import { registerPack } from './registry';
   import { cloudletPitchPack } from './cloudlet-pitch';

   registerPack(cloudletPitchPack);
   ```
2. Ejecuta los tests para confirmar su validez:
   ```bash
   cd packages/slides-kit && bun test
   ```
