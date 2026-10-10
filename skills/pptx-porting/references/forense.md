# Forense de `.pptx`

A `.pptx` is a ZIP. Inventory it slide by slide before writing any code.

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

## 3. Ejemplo real (azul-proposal, slide1)

```text
--- slide1.xml: 4 runs
   | BUSINESS
   | PROPOSAL
   | WWW.REALLYGREATSITE.COM
   | COMPANY
FONTS: {'Open Sauce Bold': 40, 'Open Sauce Semi-Bold': 36, ...}
FILLS: {'185079': 87, 'FBF6F1': 10, 'BBD6E1': 3, ...}
```

Lectura: portada de 2 líneas apiladas en `#185079` sobre marfil, fuente real
Open Sauce (el `theme.xml` dice Calibri de fábrica: ignorarlo).

## 4. Decisión tema vs layout

- Recurrente en ≥3 slides (fondo, pie, tipografía) → **tema** (tokens).
- Composición puntual (portada, pasos, equipo) → **layout firma**.
- Salida: tabla slide → layout existente (`unsarep slides layouts --search`)
  o firma nueva + matriz existente-vs-faltante.

## 5. Fuentes embebidas (obligatorio antes de capturar)

PowerPoint embebe fuentes en `ppt/fonts/*.fntdata` (EOT). LibreOffice las usa;
si no se instalan, el loop compara contra sustituciones distintas y la
paridad es inalcanzable. Caso real: `typeface="Open Sauce Heavy"` se
resuelve a la familia embarcada **Open Sauce One** (Black), no a
"Open Sauce Sans" del sistema — glifos y métricas distintos.

```bash
python3 skills/pptx-porting/scripts/eot-extract.py \
  --pptx packages/slides-kit/pptx_templates/plantilla.pptx \
  --out ~/.local/share/fonts
fc-cache -f ~/.local/share/fonts
# verifica: fc-match "Familia" y pesos 300/400/500/600/700/900
```

Regla: el `fontFamily` CSS debe apuntar a la familia que LibreOffice usa
(verifícalo en el PDF de referencia con `pdffonts ref.pdf`), no al nombre
del `typeface` del XML.
