# Loop visual (capturar → medir → corregir → repetir)

Comparación slide por slide a 1280×720 con SSIM y diferencia de píxeles.
Uso local bajo demanda; nunca en CI.

## 1. Capturar referencia (copiable)

```bash
# .pptx → PNGs 1280×720 (requiere soffice + pdftoppm)
bun skills/pptx-porting/scripts/pptx-shot.mjs \
  --pptx packages/slides-kit/pptx_templates/plantilla.pptx \
  --out shots/plantilla-canva/
# → shots/plantilla-canva/slide-01.png … slide-NN.png
```

## 2. Capturar lado UNSA

Levanta el deck (`unsarep slides dev`, puerto 4000) y captura cada slide a
1280×720 exactos (viewport del navegador 1280×720, un PNG por slide con el
mismo nombre `slide-NN.png` en `shots/plantilla-unsa/`).

### 2b. Modo dev en decks compilados

Todo deck con andamiaje (`index.html`, `src/main.tsx`, `package.json`,
`vite.config.ts`, `slides-kit.tgz`, más `custom/slides.tsx` del compilador)
corre con el CLI — sin andamiaje, `dev` cae a un servidor estático que no
renderiza React:

```bash
cd demos/decks/mi-demo && bun install          # una vez (react, vite, kit)
unsarep slides dev --port 4123                  # sirve en http://localhost:4123/
```

OJO: Vite solo enlaza IPv6 loopback (`[::1]`); usa `http://localhost:PUERTO/`,
no `http://127.0.0.1:PUERTO/`.

Convención de activos (SSR y dev comparten): el compilador emite
`ASSET = "custom/assets/"`; `unsa-shot.mjs` copia a
`<out>/.html/custom/assets/` y Vite sirve `/custom/assets/*` del proyecto.
No uses `assets/` a secas (Vite devuelve `index.html` → imágenes rotas).

Refresco del kit en decks con `slides-kit.tgz`: el tgz es un snapshot y
bun cachea la extracción aunque cambien los bytes. Tras cambiar el kit:
`bun run build` + `bun pm pack` en `packages/slides-kit`, copiar el tgz,
y en cada deck `rm -rf node_modules bun.lock && bun install` (el lockfile
fija el sha512 del tgz). Verifica con un marcador del cambio
(`grep -c <token-nuevo> node_modules/@unsa/slides-kit/dist/...`).

## 3. Comparar (copiable)

```bash
bun skills/pptx-porting/scripts/compare.mjs \
  --ref shots/plantilla-canva/ --got shots/plantilla-unsa/ \
  --threshold 0.90 --tiers reports/tiers-plantilla.json \
  --out reports/plantilla.json --md reports/plantilla.md \
  --diff reports/plantilla-diff/
```

Salida por par: `{ slide, tier, ssim, pixelDiffPct, pass, passVia }`; resumen:
`{ total, passed, passedA, passedB, ssimMin, pixelDiffMax }`.
Cada par emite su PNG de diferencias.

## 3b. Gate de dos niveles (documentado, no negociable sin evidencia)

- **Tier A** (vectorial/texto): `SSIM ≥ umbral` Y `pixdiff ≤ (1−umbral)·100`.
- **Tier B** (fotográfico): `SSIM ≥ umbral` Y `pixdiff ≤ 25%` (`--tier-b-max`).
  Solo para slides con cobertura raster ≥ 30%, auditados uno por uno en
  `reports/tiers-<deck>.json` (ausente = A). El veredicto distingue
  `PASS-A` de `PASS-B`.

Por qué existe el Tier B: el pipeline de referencia (LibreOffice → PDF con
recompresión JPEG + remuestreo de `pdftoppm`) impone un piso de ruido de
~15–20% pixdiff en fotos, washes y granos estocásticos que ningún render
puede bajar. Verificado: (a) hasta con los bytes JPEG exactos extraídos del
PDF laMSE no baja; (b) el grano revival tiene autocorrelación idéntica en
ambos lados (misma escala) pero patrón de puntos distinto (distinto
remuestreador) — irreducible a nivel de píxel. El SSIM ≥ 0.90 sigue
exigiendo paridad estructural (posición, escala, tono, texto).

## 4. Ejemplo de reporte (1 par medido)

```json
{"slide": "slide-01.png", "ssim": 0.94, "pixelDiffPct": 4.1, "pass": true}
```

## 5. Sensibilidad del umbral (copiable)

```bash
# 0.90 vs 0.95 debe cambiar veredictos en al menos un par sintético:
bun skills/pptx-porting/scripts/compare.mjs --ref shots/a/ --got shots/b/ \
  --threshold 0.90 --out /tmp/t90.json
bun skills/pptx-porting/scripts/compare.mjs --ref shots/a/ --got shots/b/ \
  --threshold 0.95 --out /tmp/t95.json
```

## 6. Iterar

Repite captura → comparación → corrección (tema o layout) hasta 100% `pass`.
Un fallo registra deuda (REQ, delta numérico, responsable); sin debt no hay
DONE. Sin `soffice`/navegador, el forense + código avanzan y la captura
pixel queda como deuda explícita.

## 7. Loop con compilador (vía rápida 1:1)

Cuando el deck sale de `pptx-to-slides.py`, no edites `custom/slides.tsx`
a mano: cada fix va al compilador para que todos los decks mejoren.
Ciclo copiable (ajusta `--react-pkg` a tu `node_modules/react`):

```bash
REACT=$PWD/packages/slides-kit/node_modules/react
python3 skills/pptx-porting/scripts/pptx-to-slides.py \
  --pptx packages/slides-kit/pptx_templates/plantilla.pptx \
  --theme mi-tema --slug mi-demo --title "Mi Deck" \
  --out demos/decks/mi-demo --react-pkg "$REACT" 2>skipped.log
bun skills/pptx-porting/scripts/validate-deck.mjs \
  --deck demos/decks/mi-demo/deck.config.ts
bun skills/pptx-porting/scripts/unsa-shot.mjs \
  --deck demos/decks/mi-demo/deck.config.ts --out shots/mi-unsa/
bun skills/pptx-porting/scripts/compare.mjs \
  --ref shots/mi-canva/ --got shots/mi-unsa/ --threshold 0.90 \
  --tiers demos/decks/reports/tiers-mi.json \
  --out /tmp/mi.json --md /tmp/mi.md
# La demo validada se integra al ecosistema como layouts (un layout por
# slide en packages/slides-kit/src/layouts/<tema>/, assets en
# packages/slides-kit/src/assets/<tema>/, registro en layouts/<tema>.ts +
# catalog.ts, espejo Go en tui/internal/slides/catalog.go). `init --theme`
# genera entonces la réplica exacta sin custom/ ni assets sueltos.
```

Diagnóstico por síntoma (todos verificados en 3 plantillas reales):

- Texto que se desborda línea a línea (+3px/línea): falta `font-size` en
  el `<p>` (el strut a 16px ensancha la unión por encima del line-height).
- Primera línea alta/baja varios px: compensación de LO por ratio
  (`fs*(0.70*ratio-0.783)`, ratio = pitch/fs); ratio 1.4 ≈ half-leading.
- Última línea cortada en caja ajustada: PowerPoint/LO no recorta texto
  (`overflow: visible` en divs de texto, nunca `hidden`).
- Viñetas que rompen distinto: `marL` + `textIndent` negativo (sangría
  francesa), no prefijo inline con el mismo margen.
- Fuente "casi" correcta en grosor/anchura: extrae las EOT embebidas
  (puede ser otra familia: Open Sauce One ≠ Open Sauce Sans) y apunta el
  CSS a lo que LibreOffice usa (`pdffonts` manda).
- Wash/imagen corrida o de otro tono: verifica ventana `srcRect`/`fillRect`
  por ajuste de plantilla (misma matemática que LO); el tono residual es
  piso del pipeline (Tier B), no bug.
- Bordes ausentes en formas libres: la rama SVG también lleva `stroke`
  del `<a:ln>`; `roundRect`/`ellipse` necesitan su radio.
