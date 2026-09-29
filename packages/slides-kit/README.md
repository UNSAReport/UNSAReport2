# @unsa/slides-kit

Kit oficial de diapositivas interactivas para el ecosistema **UNSAReport**, basado en Reveal.js, React y TypeScript.

---

## Características

- 🎯 **110 Layouts Oficiales** organizados en 9 familias (`hero`, `split`, `bento`, `stats`, `process`, `code`, `list`, `quote`, `closing`).
- 🎨 **Layouts Neutros**: Los componentes son estrictamente estructurales; el color, tipografía y estilo visual son inyectados exclusivamente por los temas a través de variables CSS.
- 🏛️ **Temas Institucionales**: `unsa-dark` (predeterminado institucional), `unsa-classic` (académico formal), `epis-tech` (ciencias de la computación / tecnología).
- 🧩 **Primitivas Flexibles**: `SlideGrid`, `SlideSplit`, `SlideStack`, `SlideCard`, `SlideAccent`, `SlideSection`.
- 📦 **Cero Barrel Files**: Exportaciones canónicas directas mediante `package.json` para optimizar compilación y tree-shaking.
- ⚡ **Tipado Estricto**: Función `defineConfig()` para configuración de presentaciones con autocompletado en el IDE.

---

## Estructura de Módulos

```mermaid
flowchart TD
    subgraph Package["packages/slides-kit"]
        PackageJson["package.json<br/>(Subpath Exports canónicos)"]

        subgraph Entrypoints["Puntos de Entrada Canónicos"]
            Config["src/config.ts<br/>defineConfig()"]
            Types["src/types.ts<br/>DeckConfig, SlideDefinition"]
        end

        subgraph LayoutsModule["Dominio: src/layouts/"]
            LRegistry["layouts/registry.ts<br/>LayoutRegistry"]
            LCatalog["layouts/catalog.ts<br/>Catálogo de 110 Layouts"]
            LTypes["layouts/types.ts<br/>LayoutDefinition, LayoutCategory"]
            LComponents["layouts/{hero,split,bento,...}/*.tsx<br/>Componentes React"]

            LRegistry --> LCatalog
            LCatalog --> LComponents
            LCatalog --> LTypes
            LRegistry --> LTypes
        end

        subgraph ThemesModule["Dominio: src/themes/"]
            TRegistry["themes/registry.ts<br/>ThemeRegistry"]
            TCatalog["themes/catalog.ts<br/>Catálogo de Temas"]
            TTypes["themes/types.ts<br/>ThemeDefinition, ThemeId"]
            TFiles["themes/{unsa-dark,unsa-classic,epis-tech}.ts"]

            TRegistry --> TCatalog
            TCatalog --> TFiles
            TCatalog --> TTypes
            TRegistry --> TTypes
        end

        subgraph PrimitivesModule["Dominio: src/primitives/"]
            Prim["primitives/*.tsx<br/>SlideGrid, SlideSplit, SlideCard, SlideAccent..."]
        end

        subgraph RendererModule["Dominio: src/renderer/"]
            DeckR["renderer/DeckRenderer.tsx<br/>Motor Reveal.js"]
            SlideR["renderer/SlideRenderer.tsx<br/>Resolver de Layouts"]
            ThemeP["renderer/ThemeProvider.tsx<br/>Inyector de Tokens CSS"]

            DeckR --> SlideR
            DeckR --> ThemeP
        end

        PackageJson --> Config
        PackageJson --> Types
        PackageJson --> LRegistry
        PackageJson --> TRegistry
        PackageJson --> DeckR
        PackageJson --> SlideR
        PackageJson --> ThemeP
        PackageJson --> Prim
    end
```

---

## Flujo de Registro de Layouts

```mermaid
flowchart LR
    subgraph Creacion["1. Definición del Layout"]
        Comp["Componente React Estructural<br/>layouts/bento/bento-4-featured-left.tsx"]
        Meta["Metadatos LayoutDefinition<br/>id, name, category, slots, description"]
        Comp --> Meta
    end

    subgraph Registro["2. Registro Central"]
        Catalog["layouts/catalog.ts<br/>defaultLayouts = [...]"]
        Registry["layouts/registry.ts<br/>LayoutRegistry.registerLayout()"]
        Meta --> Catalog
        Catalog --> Registry
    end

    subgraph Consumo["3. Consumo"]
        CLI["CLI: unsarep slides layouts"]
        WebCat["Web: /presentations/catalog"]
        Renderer["SlideRenderer.tsx"]

        Registry --> CLI
        Registry --> WebCat
        Registry --> Renderer
    end
```

---

## Flujo de Registro e Inyección de Temas

```mermaid
flowchart LR
    subgraph DefTheme["1. Definición de Tema"]
        Tokens["Tokens de Tema<br/>ColorPalette, Typography, Effects"]
        ThemeMeta["ThemeDefinition<br/>id, name, description, colors, typography, effects"]
        Tokens --> ThemeMeta
    end

    subgraph RegTheme["2. Registro Central de Temas"]
        TCatalog["themes/catalog.ts<br/>defaultThemes = [unsa-dark, ...]"]
        TRegistry["themes/registry.ts<br/>ThemeRegistry.registerTheme()"]
        ThemeMeta --> TCatalog
        TCatalog --> TRegistry
    end

    subgraph Inyeccion["3. Inyección y Consumo"]
        TProvider["ThemeProvider.tsx<br/>Genera variables CSS"]
        Reveal["Reveal.js Container<br/>Aplica variables a layouts"]

        TRegistry --> TProvider
        TProvider --> Reveal
    end
```

---

## Uso en `deck.config.ts`

```typescript
import { defineConfig } from '@unsa/slides-kit';

export default defineConfig({
  title: 'Investigación en Inteligencia Artificial',
  theme: 'unsa-dark',
  slides: [
    {
      id: 'portada',
      layout: 'hero-split',
      title: 'Avances en Modelos Generativos',
      subtitle: 'Facultad de Ingeniería de Producción y Servicios',
      author: 'Gustavo Dev',
      date: '2026-09-26',
    },
    {
      id: 'arquitectura',
      layout: 'bento-4-featured-left',
      badge: 'Metodología',
      title: 'Módulos del Sistema',
      featured: {
        title: 'Core Engine',
        description: 'Procesamiento de datos en tiempo real.',
      },
      cards: [
        { title: 'Ingesta', description: 'Pipeline de datos' },
        { title: 'Inferencia', description: 'Modelos pre-entrenados' },
        { title: 'Auditoría', description: 'Trazabilidad y métricas' },
      ],
    },
  ],
});
```

---

## Subpath Exports

Para importar componentes y utilidades del paquete:

```typescript
// Configuración y tipos base
import { defineConfig } from '@unsa/slides-kit';
import type { DeckConfig, SlideDefinition } from '@unsa/slides-kit/types';

// Registros de layouts y temas
import { layoutRegistry, listLayouts } from '@unsa/slides-kit/layouts';
import { themeRegistry, getTheme } from '@unsa/slides-kit/themes';

// Renderizadores
import { DeckRenderer } from '@unsa/slides-kit/renderer/DeckRenderer';
import { ThemeProvider } from '@unsa/slides-kit/renderer/ThemeProvider';

// Primitivas CSS
import { SlideCard } from '@unsa/slides-kit/primitives/SlideCard';
```
