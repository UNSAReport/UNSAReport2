# Matriz tema-layout

Cada layout firma declara en qué temas luce óptimo. Lo no declarado es
universal y sigue visible en todos los listados.

## 1. Receta de inclusión (una línea, copiable)

```tsx
export const splitNumberedSteps: LayoutDefinition = {
  id: 'split-numbered-steps',
  supportedThemes: ['azul-proposal'], // ← la única línea que agrega
  // ...resto igual
};
```

## 2. Curaduría del tema (no filtra, solo galería)

```ts
export const azulProposalTheme: ThemeDefinition = {
  id: 'azul-proposal',
  showcaseLayouts: ['hero-stacked-duo-footer', 'hero-two-line'],
  // supportedLayouts ausente = el tema acepta todos los layouts
};
```

## 3. Tokens firma con fallback (copiable)

Los layouts son cromo-neutrales: consumen `var(--slide-*)`. Un token firma
que otro tema no define debe degradar, nunca romper:

```tsx
style={{ backgroundColor: 'var(--slide-number-disc, var(--slide-accent))' }}
```

El proveedor ignora con aviso las `customVariables` que colisionen con un
token central (`ThemeProvider.tsx`); usa prefijos propios (`--slide-blob-*`).

## 4. Consultas (copiables)

```bash
bun -e "import {listLayouts} from './src/layouts/registry.ts'; \
  console.log(listLayouts({theme:'azul-proposal'}).map(l=>l.id).join('\n'))"
unsarep slides layouts --theme azul-proposal
unsarep slides themes --layout hero-two-line
```

## 5. QA 1280×720

Regiones que crecen: `flex-1 min-h-0 overflow-hidden`; texto con
`line-clamp-*`/`truncate`; arreglos capados. Detalle en
`../slides-authoring/references/qa-bounds.md`.
