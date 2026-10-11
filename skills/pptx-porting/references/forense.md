# Forense de `.pptx`

Un `.pptx` es un archivo ZIP estándar. Realiza un inventario forense slide por slide
antes de escribir una sola línea de código o crear componentes.

## 1. Estructura (copiable)

```bash
PPTX="plantilla.pptx"
unzip -l "$PPTX" | grep -E "slides/slide[0-9]+\.xml|slideMasters|slideLayouts|theme/theme|media/" | head -40
# slides/slideN.xml = contenido real | slideMasters = fondos | media/ = imágenes
```

## 2. Texto, fuentes y colores por slide (copiable)

```bash
python3 - <<'EOF'
import zipfile, xml.etree.ElementTree as ET, re
from collections import Counter
z = zipfile.ZipFile("plantilla.pptx")
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
fonts, fills = Counter(), Counter()
for n in sorted(z.namelist()):
    if not re.fullmatch(r'ppt/slides/slide\d+\.xml', n):
        continue
    root = ET.fromstring(z.read(n))
    texts = [ ''.join(t.text or '' for t in r.iter(A+'t')).strip()
              for r in root.iter(A+'r') ]
    texts = [t for t in texts if t]
    fonts.update(e.get('typeface') for e in root.iter(A+'latin') if e.get('typeface'))
    fills.update(e.get('val') for e in root.iter(A+'srgbClr'))
    print(f"--- {n.split('/')[-1]}: {len(texts)} runs")
    for t in texts[:12]:
        print('   |', t[:100])
print('FONTS:', dict(fonts.most_common(6)))
print('FILLS:', dict(fills.most_common(10)))
EOF
```

## 3. Ejemplo real (`azul-proposal`, slide 1)

```text
--- slide1.xml: 4 runs
   | BUSINESS
   | PROPOSAL
   | WWW.REALLYGREATSITE.COM
   | COMPANY
FONTS: {'Open Sauce Bold': 40, 'Open Sauce Semi-Bold': 36, ...}
FILLS: {'185079': 87, 'FBF6F1': 10, 'BBD6E1': 3, ...}
```

Lectura: portada de 2 líneas apiladas en `#185079` sobre marfil `#FBF6F1`, fuente real
Open Sauce (el `theme.xml` suele decir Calibri de fábrica: ignorarlo siempre).

## 4. Categorización Forense de Elementos Visuales

Durante el análisis forense, clasifica de forma rigurosa cada elemento visual en una
de las siguientes categorías:

### A. CSS-Replicable (Obligatorio en CSS/Tailwind)
Todo efecto cosmético estructural debe implementarse mediante CSS puro o Tailwind:
- **Washes, gradientes y glows:** Degradados radiales y lineales (`radial-gradient(...)`, `linear-gradient(...)`).
- **Desenfoques y filtros:** `filter: blur(...)`, `backdrop-filter: blur(...)`.
- **Paneles y tarjetas:** Cajas semánticas con fondo translúcido (`background: rgba(...)`), sombras (`box-shadow`, `drop-shadow`).
- **Bordes y acentos geométricos:** Líneas separadoras (`height: 1px`, `border-*`), píldoras o círculos (`border-radius: 9999px`).
- **Regla estricta:** **PROHIBIDO** exportar imágenes raster decorativas (PNG/JPEG de washes, difuminados, destellos o formas geométricas simples) desde el `.pptx`.

### B. Remote Assets (Zero Binarios Locales)
Elementos que representan contenido real irreproducible por CSS:
- **Fotos e ilustraciones fotográficas:** Retratos de equipo, fotos de producto, capturas de pantalla.
- **Iconos limpios:** Gráficos vectoriales o marcas que no sean simples formas geométricas.
- **Almacenamiento remoto:** Estos assets deben optimizarse (WebP/JPEG limpio) y subirse al CDN de UNSAReport / SeaweedFS S3 (`/api/slides/assets/templates/:packId/:filename`).
- **Regla estricta:** **NUNCA** comitear binarios pesados al repositorio de git ni empaquetarlos dentro de `@unsa/slides-kit`.

### C. Higiene TSX (Prohibido SVG Inline Spaghetti)
- **Cero SVG inline masivos:** Queda estrictamente prohibido incrustar bloques kilométricos de `<svg><path d="M ... Z" /></svg>` dentro del código TSX de las slides. El código debe mantenerse legible, modular y mantenible.
- **Conversión de formas:** Si el `.pptx` contiene una forma geométrica (círculos, líneas, rectángulos, viñetas), conviértela a contenedores y estilos CSS nativos (`<div>`, clases de Tailwind o inline styles).
- **Iconos:** Si un icono vectorial no se puede resolver con CSS simple o fuentes tipográficas, trátalo como asset remoto (`<img src={getTemplateAssetUrl(packId, filename)} />`).

## 5. Arquitectura Template Pack: Tema vs Slide

En lugar de layouts huérfanos o matrices desacopladas:
- **Tokens de Tema (`theme.ts`):** Extrae tipografías base, jerarquía de tamaños, colores dominantes y acentos recurrentes en ≥3 slides en el `ThemeDefinition` del pack.
- **Template Slides (`slides/*.tsx`):** Cada slide única del PPTX se implementa como una `TemplateSlide` atómica con sus slots de contenido parametrizados (`SlotSchema[]`), estilos CSS limpios y referencias a assets remotos.

## 6. Fuentes embebidas (obligatorio antes de capturar)

PowerPoint embebe fuentes en `ppt/fonts/*.fntdata` (EOT). LibreOffice las usa;
si no se instalan, el loop visual compara contra sustituciones erróneas y la
paridad pixel-perfect es inalcanzable. Caso real: `typeface="Open Sauce Heavy"` se
resuelve a la familia embarcada **Open Sauce One** (Black), no a
"Open Sauce Sans" del sistema — los glifos y métricas divergen por completo.

```bash
python3 skills/pptx-porting/scripts/eot-extract.py \
  --pptx packages/slides-kit/pptx_templates/plantilla.pptx \
  --out ~/.local/share/fonts
fc-cache -f ~/.local/share/fonts
# verifica: fc-match "Familia" y pesos 300/400/500/600/700/900
```

Regla: el `fontFamily` CSS debe apuntar a la familia que LibreOffice usa
(verifícalo en el PDF de referencia con `pdffonts ref.pdf`), no al nombre
literal del `typeface` del XML.

## 7. Inventario y Extracción de Medios (`ppt/media/`)

Para auditar y extraer los recursos binarios antes de subirlos al CDN de SeaweedFS:

```bash
PPTX="plantilla.pptx"
unzip -l "$PPTX" | grep "ppt/media/"
# Extrae solo imágenes reales a un directorio temporal de staging (no comitear a git)
unzip -j "$PPTX" "ppt/media/*" -d /tmp/pack-assets/
ls -lh /tmp/pack-assets/
```
