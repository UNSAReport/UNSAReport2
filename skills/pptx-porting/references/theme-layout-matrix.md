# Matriz Tema-Layout (Deprecada / En Transición)

> [!NOTE]
> El modelo anterior de matriz tema-layout basado en `supportedThemes: ['...']` dentro de layouts individuales y `showcaseLayouts: [...]` en definiciones de temas ha sido **sustituido** por la arquitectura canónica de **Template Packs** (`TemplatePack` y `TemplateSlide`).

Para consultar la documentación completa de la arquitectura actual, consulta:
👉 **[Template Packs](file:///home/gustadev121/orca/workspaces/UNSAReport2/dev-2/skills/pptx-porting/references/template-packs.md)**

---

## Resumen del Cambio Arquitectural

1. **Ubicación Canónica:**
   Los templates ya no se registran como layouts globales huérfanos con directivas de filtrado de tema. Ahora residen en paquetes atómicos en `packages/slides-kit/src/packs/<pack-id>/`.
2. **Estructura Atómica:**
   Cada `TemplatePack` agrupa su `theme` (estilos puros y tokens) y sus `slides` (`TemplateSlide[]` con sus slots parametrizables y componentes React limpios).
3. **Assets Remotos (Zero Local Binaries):**
   Las imágenes binarias e iconos no se commitean localmente; se suben a SeaweedFS S3 y se resuelven en runtime mediante `getTemplateAssetUrl(packId, filename)`.
4. **CSS-First & Higiene TSX:**
   Washes, gradientes y glows se resuelven en CSS puro / Tailwind. Se prohíbe terminantemente la inyección de bloques masivos de SVG inline.
