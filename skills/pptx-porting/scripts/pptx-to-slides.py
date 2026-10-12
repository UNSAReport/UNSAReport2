#!/usr/bin/env python3
"""pptx-to-slides.py — compila slides de un .pptx a componentes React 1:1.

Lee geometría (EMU), texto (runs, tamaños, colores), rellenos (sólido,
degradado, imagen), imágenes y paths Bézier, y emite un .tsx con un
componente absoluto por slide (fondo 1280x720) más deck.config.ts con
layout 'custom'.

Uso:
  pptx-to-slides.py --pptx plantilla.pptx --theme mi-tema --slug mi-demo \\
      --out demos/decks/mi-demo
"""
import argparse
import json
import os
import re
import shutil
import sys
import zipfile
import xml.etree.ElementTree as ET

A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
P = '{http://schemas.openxmlformats.org/presentationml/2006/main}'
R = '{http://schemas.openxmlformats.org/package/2006/relationships}'
RE = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'

EMU_PER_PX = 14287.5  # sldSz 18288000x10287000 -> 1280x720
# El slide mide 20in de ancho -> 1280px = 64px/in. Los puntos tipográficos
# (sz, spc, spcPts) escalan a 64/72, NO a 96/72.
PT_TO_PX = 64 / 72


def emu(v):
    return round(int(v) / EMU_PER_PX, 1)


def px100pt(v):
    """100ths of point -> px (slide a 64px/in)."""
    return round(int(v) / 100 * PT_TO_PX, 2)


# --- color ---------------------------------------------------------------
def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_hex(r, g, b):
    return '#%02x%02x%02x' % (
        max(0, min(255, int(round(r)))),
        max(0, min(255, int(round(g)))),
        max(0, min(255, int(round(b)))))


def rgb_to_hsl(r, g, b):
    r, g, b = r / 255, g / 255, b / 255
    mx, mn = max(r, g, b), min(r, g, b)
    l = (mx + mn) / 2
    if mx == mn:
        return 0.0, 0.0, l
    d = mx - mn
    s = d / (2 - mx - mn) if l > 0.5 else d / (mx + mn)
    if mx == r:
        h = (g - b) / d + (6 if g < b else 0)
    elif mx == g:
        h = (b - r) / d + 2
    else:
        h = (r - g) / d + 4
    return h / 6, s, l


def hsl_to_rgb(h, s, l):
    def hue(p, q, t):
        t = t % 1
        if t < 1 / 6:
            return p + (q - p) * 6 * t
        if t < 1 / 2:
            return q
        if t < 2 / 3:
            return p + (q - p) * (2 / 3 - t) * 6
        return p
    if s == 0:
        v = int(round(l * 255))
        return v, v, v
    q = l * (1 + s) if l < 0.5 else l + s - l * s
    p = 2 * l - q
    return (int(round(hue(p, q, h + 1 / 3) * 255)),
            int(round(hue(p, q, h) * 255)),
            int(round(hue(p, q, h - 1 / 3) * 255)))


class Ctx:
    def __init__(self, scheme, fonts):
        self.scheme = scheme
        self.fonts = fonts  # {'major': typeface, 'minor': typeface}


# typeface del XML -> (familia CSS instalada, peso). LO sustituye igual.
# 'Open Sauce X' = familia embarcada 'Open Sauce One' (EOT en ppt/fonts/,
# extraída con scripts/eot-extract.py); NO es 'Open Sauce Sans'.
FONT_MAP = {
    'Roboto Bold': ('Roboto', 700),
    'Open Sauce Heavy': ('Open Sauce One', 900),
    'Open Sauce Bold': ('Open Sauce One', 700),
    'Open Sauce Semi-Bold': ('Open Sauce One', 600),
    'Open Sauce Medium': ('Open Sauce One', 500),
    'Open Sauce Light': ('Open Sauce One', 300),
    'Open Sauce': ('Open Sauce One', 400),
    'PT Serif Bold': ('PT Serif', 700),
    'Calibri': ('Carlito', None),
}


def font_css(typeface, ctx, def_rpr=None, rpr=None):
    """Familia+peso CSS desde typeface (con fallback defRPr -> tema)."""
    tf = typeface
    if not tf and def_rpr is not None:
        lt = def_rpr.find(A + 'latin')
        if lt is not None:
            tf = lt.get('typeface')
    if not tf:
        tf = ctx.fonts.get('minor') or 'Calibri'
    st = {}
    mapped = FONT_MAP.get(tf or '')
    b = (rpr.get('b') if rpr is not None else None) or (def_rpr.get('b') if def_rpr is not None else None)
    if mapped:
        st['fontFamily'] = f"'{mapped[0]}', sans-serif"
        if mapped[1]:
            st['fontWeight'] = mapped[1]
        elif b == '1' or b == 'true':
            st['fontWeight'] = 'bold'
    else:
        if tf:
            st['fontFamily'] = f"'{tf}', sans-serif"
        if b == '1' or b == 'true':
            st['fontWeight'] = 'bold'
    return st


def resolve_color(el, ctx):
    """Resuelve srgbClr/schemeClr (+tint/shade/lumMod/lumOff/satMod/alpha).

    Acepta el nodo color directamente o su contenedor (solidFill, gs, ...).
    """
    if el is None:
        return None
    tag = el.tag.split('}')[1]
    if tag in ('srgbClr', 'schemeClr'):
        node = el
    else:
        node = el.find(A + 'srgbClr')
        if node is None:
            node = el.find(A + 'schemeClr')
    if node is None:
        return None
    ntag = node.tag.split('}')[1]
    if ntag == 'srgbClr':
        rgb = list(hex_rgb(node.get('val')))
    else:
        base = ctx.scheme.get(node.get('val'), '000000')
        rgb = list(hex_rgb(base))
    alpha = 1.0
    for mod in node:
        tag = mod.tag.split('}')[1]
        v = int(mod.get('val', '0')) / 100000
        if tag == 'tint':
            rgb = [c * v + 255 * (1 - v) for c in rgb]
        elif tag == 'shade':
            rgb = [c * v for c in rgb]
        elif tag == 'alpha':
            alpha = v
        elif tag in ('lumMod', 'lumOff', 'satMod'):
            h, s, l = rgb_to_hsl(*rgb)
            if tag == 'lumMod':
                l = max(0.0, min(1.0, l * v))
            elif tag == 'lumOff':
                l = max(0.0, min(1.0, l + v))
            else:
                s = max(0.0, min(1.0, s * v))
            rgb = list(hsl_to_rgb(h, s, l))
    if alpha >= 0.999:
        return rgb_hex(*rgb)
    return 'rgba(%d,%d,%d,%s)' % (rgb[0], rgb[1], rgb[2], round(alpha, 3))


def fill_css(sp_pr, ctx):
    """Fondo CSS desde spPr (solid/grad/blip/none)."""
    if sp_pr is None:
        return None
    solid = sp_pr.find(A + 'solidFill')
    if solid is not None and len(solid):
        c = resolve_color(solid[0], ctx)
        if c:
            return {'background': c}
    grad = sp_pr.find(A + 'gradFill')
    if grad is not None:
        info = grad_info(grad, ctx)
        if info:
            ang, stops = info
            return {'background': f"linear-gradient({round(ang)}deg, {', '.join(f'{c} {round(p * 100, 1)}%' for p, c in stops)})"}
    return None


# --- texto ---------------------------------------------------------------
def esc(s):
    return json.dumps(s, ensure_ascii=False)


def jsx_text(s):
    """Texto crudo para nodos JSX (sin comillas JSON)."""
    return (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
             .replace('{', '&#123;').replace('}', '&#125;'))


def run_style(rpr, def_rpr):
    st = {}
    sz = (rpr.get('sz') if rpr is not None else None) or (def_rpr.get('sz') if def_rpr is not None else None)
    if sz:
        st['fontSize'] = f'{px100pt(sz)}px'
    b = (rpr.get('b') if rpr is not None else None) or (def_rpr.get('b') if def_rpr is not None else None)
    if b == '1' or b == 'true':
        st['fontWeight'] = 'bold'
    i = (rpr.get('i') if rpr is not None else None) or (def_rpr.get('i') if def_rpr is not None else None)
    if i == '1' or i == 'true':
        st['fontStyle'] = 'italic'
    return st


def compile_textbox(sp, ctx):
    tx = sp.find(P + 'txBody')
    if tx is None:
        return None
    body = tx.find(A + 'bodyPr')
    anchor = body.get('anchor') if body is not None else None
    wrap = body.get('wrap') if body is not None else None
    l_ins = emu(body.get('lIns', '91440')) if body is not None else 9.6
    r_ins = emu(body.get('rIns', '91440')) if body is not None else 9.6
    t_ins = emu(body.get('tIns', '45720')) if body is not None else 4.8
    b_ins = emu(body.get('bIns', '45720')) if body is not None else 4.8
    def_rpr = tx.find(A + 'lstStyle/' + A + 'defRPr')
    if def_rpr is None:
        def_rpr = tx.find(A + 'defRPr')
    paras = []
    for p in tx.iter(A + 'p'):
        ppr = p.find(A + 'pPr')
        algn = ppr.get('algn', 'l') if ppr is not None else 'l'
        align = {'l': 'left', 'ctr': 'center', 'r': 'right', 'just': 'justify'}.get(algn, 'left')
        mar_l = mar_r = indent = spc_bfr = spc_aft = ln = None
        if ppr is not None:
            mar_l = ppr.get('marL')
            mar_r = ppr.get('marR')
            indent = ppr.get('indent')
            for tag_, key in (('spcBef', 'bfr'), ('spcBfr', 'bfr'), ('spcAft', 'aft')):
                spc = ppr.find(A + tag_)
                if spc is not None and len(spc):
                    ch = spc[0]
                    if ch.tag == A + 'spcPts':
                        if key == 'bfr':
                            spc_bfr = px100pt(ch.get('val'))
                        else:
                            spc_aft = px100pt(ch.get('val'))
            lsp = ppr.find(A + 'lnSpc')
            if lsp is not None and len(lsp):
                ch = lsp[0]
                if ch.tag == A + 'spcPct':
                    ln = round(int(ch.get('val')) / 100000, 3)
                elif ch.tag == A + 'spcPts':
                    ln = f"{px100pt(ch.get('val'))}px"
        # bullets
        bullet = ''
        if ppr is not None:
            bu = ppr.find(A + 'buChar')
            if bu is not None:
                bullet = bu.get('char', '•') + '  '
        spans = []
        for r in p.iter(A + 'r'):
            t = ''.join(x.text or '' for x in r.iter(A + 't'))
            if not t:
                continue
            rpr = r.find(A + 'rPr')
            st = run_style(rpr, def_rpr)
            if rpr is not None:
                tf = rpr.find(A + 'latin')
                st.update(font_css(tf.get('typeface') if tf is not None else None,
                                   ctx, def_rpr, rpr))
                col = rpr.find(A + 'solidFill')
                if col is not None and len(col):
                    c = resolve_color(col[0], ctx)
                    if c:
                        st['color'] = c
                cap = rpr.get('cap')
                if cap == 'all':
                    st['textTransform'] = 'uppercase'
                elif cap == 'small':
                    st['textTransform'] = 'uppercase'
                    st['fontSize'] = st.get('fontSize', '16px')
                spc = rpr.get('spc')
                if spc and spc != '0':
                    st['letterSpacing'] = f'{px100pt(spc)}px'
                if rpr.get('u') not in (None, 'none'):
                    st['textDecoration'] = 'underline'
                if rpr.get('strike') not in (None, 'noStrike', None):
                    st['textDecoration'] = 'line-through'
            spans.append((bullet + t if not spans else t, st))
            bullet = ''
        if spans:
            paras.append({'align': align, 'marL': mar_l, 'marR': mar_r, 'indent': indent,
                          'bfr': spc_bfr, 'aft': spc_aft, 'ln': ln, 'spans': spans})
    if not paras:
        return None
    return {'anchor': anchor, 'wrap': wrap, 'pad': (l_ins, r_ins, t_ins, b_ins),
            'paras': paras, 'defsz': def_rpr.get('sz') if def_rpr is not None else None}


def justify(tx):
    return {'t': 'flex-start', 'ctr': 'center', 'b': 'flex-end'}.get(tx['anchor'] or 't', 'flex-start')


def camel(k):
    parts = k.split('-')
    return parts[0] + ''.join(p[:1].upper() + p[1:] for p in parts[1:])


def css(st):
    """Diccionario CSS -> objeto style React completo ({{...}})."""
    return '{{ ' + ', '.join(f'{camel(k)}: {json.dumps(v, ensure_ascii=False)}' for k, v in st.items()) + ' }}'


# --- formas ---------------------------------------------------------------
def xfrm_box(xfrm):
    off = xfrm.find(A + 'off')
    ext = xfrm.find(A + 'ext')
    flip_h = xfrm.get('flipH') == '1'
    flip_v = xfrm.get('flipV') == '1'
    rot = int(xfrm.get('rot', '0')) / 60000
    return (emu(off.get('x')), emu(off.get('y')),
            emu(ext.get('cx')), emu(ext.get('cy')), flip_h, flip_v, rot)


def grad_info(grad, ctx):
    """Devuelve (cssDeg, [(offset0-1, color), ...]) de un gradFill."""
    if grad is None:
        return None
    lin = grad.find(A + 'lin')
    ang = ((int(lin.get('ang', '5400000')) / 60000) + 90) % 360 if lin is not None else 180
    stops = []
    for gs in grad.iter(A + 'gs'):
        pos = int(gs.get('pos', '0')) / 100000
        c = resolve_color(gs, ctx) or '#000000'
        stops.append((pos, c))
    if not stops:
        return None
    return ang, stops


def svg_fill(sp_pr, ctx, gid):
    """Relleno para path SVG: color plano o url(#gradiente). Devuelve (attr, defs)."""
    if sp_pr is None:
        return 'transparent', ''
    solid = sp_pr.find(A + 'solidFill')
    if solid is not None and len(solid):
        return resolve_color(solid[0], ctx) or 'transparent', ''
    grad = sp_pr.find(A + 'gradFill')
    if grad is not None:
        info = grad_info(grad, ctx)
        if info:
            import math
            ang, stops = info
            rad = math.radians(ang)
            dx, dy = math.sin(rad), -math.cos(rad)
            defs = [f'<linearGradient id="{gid}" x1="{0.5 - dx / 2:.3f}" y1="{0.5 - dy / 2:.3f}" '
                    f'x2="{0.5 + dx / 2:.3f}" y2="{0.5 + dy / 2:.3f}">']
            for pos, c in stops:
                if c.startswith('rgba'):
                    m = re.match(r'rgba\((\d+),(\d+),(\d+),([\d.]+)\)', c)
                    if m:
                        r, g, b, a = m.groups()
                        defs.append(f'<stop offset="{pos:.3f}" stop-color="rgb({r},{g},{b})" stop-opacity="{a}" />')
                        continue
                defs.append(f'<stop offset="{pos:.3f}" stop-color="{c}" />')
            defs.append('</linearGradient>')
            return f'url(#{gid})', ''.join(defs)
    return 'transparent', ''


def svg_path(cust, w_px, h_px):
    """Convierte custGeom a path SVG (unidades w/h del path)."""
    paths = list(cust.iter(A + 'path'))
    out = []
    for path in paths:
        pw = int(path.get('w', '0')) or 1
        ph = int(path.get('h', '0')) or 1
        sx, sy = w_px / pw, h_px / ph
        d = []
        for el in path:
            tag = el.tag.split('}')[1]
            if tag == 'moveTo':
                pt = el.find(A + 'pt')
                d.append(f"M {float(pt.get('x')) * sx:.1f} {float(pt.get('y')) * sy:.1f}")
            elif tag == 'lnTo':
                pt = el.find(A + 'pt')
                d.append(f"L {float(pt.get('x')) * sx:.1f} {float(pt.get('y')) * sy:.1f}")
            elif tag == 'cubicBezTo':
                pts = el.findall(A + 'pt')
                d.append('C ' + ' '.join(f"{float(p.get('x')) * sx:.1f} {float(p.get('y')) * sy:.1f}" for p in pts))
            elif tag == 'quadBezTo':
                pts = el.findall(A + 'pt')
                d.append('Q ' + ' '.join(f"{float(p.get('x')) * sx:.1f} {float(p.get('y')) * sy:.1f}" for p in pts))
            elif tag == 'close':
                d.append('Z')
            elif tag == 'arcTo':
                pass  # raro en estas plantillas: ignorar segmento
        out.append(' '.join(d))
    return out


def box(x, y, w, h, rot=0, fh=False, fv=False, extra=None):
    st = {'position': 'absolute', 'left': f'{x}px', 'top': f'{y}px',
          'width': f'{w}px', 'height': f'{h}px'}
    tr = []
    if rot:
        tr.append(f'rotate({round(rot, 2)}deg)')
    if fh:
        tr.append('scaleX(-1)')
    if fv:
        tr.append('scaleY(-1)')
    if tr:
        st['transform'] = ' '.join(tr)
    if extra:
        st.update(extra)
    return st


def blip_opacity(blip):
    """Opacidad 0-1 desde efectos del blip (alphaModFix); None si opaco."""
    if blip is None:
        return None
    op = 1.0
    for ef in blip:
        if ef.tag == A + 'alphaModFix':
            op *= int(ef.get('amt', '100000')) / 100000
    return op if op < 0.999 else None


def img_el(src, x, y, w, h, blip_fill=None, extra=None, rot=0, fh=False, fv=False):
    """<img> con recorte srcRect (milesimas de %) y zoom fillRect si existen."""
    l = t = r = b = 0.0
    lf = tf = rf = bf = 0.0
    if blip_fill is not None:
        sr = blip_fill.find(A + 'srcRect')
        if sr is not None:
            l = int(sr.get('l', '0')) / 100000
            t = int(sr.get('t', '0')) / 100000
            r = int(sr.get('r', '0')) / 100000
            b = int(sr.get('b', '0')) / 100000
        st = blip_fill.find(A + 'stretch')
        fr = st.find(A + 'fillRect') if st is not None else None
        if fr is not None:
            lf = int(fr.get('l', '0')) / 100000
            tf = int(fr.get('t', '0')) / 100000
            rf = int(fr.get('r', '0')) / 100000
            bf = int(fr.get('b', '0')) / 100000
    if not (l or t or r or b or lf or tf or rf or bf):
        st = box(x, y, w, h, rot, fh, fv, extra)
        if blip_fill is not None:
            op = blip_opacity(blip_fill.find(A + 'blip'))
            if op is not None:
                st['opacity'] = round(op, 3)
        return f'<img src={{ASSET + {esc(src)}}} style={css(st)} />'
    vw, vh = max(0.01, 1 - l - r), max(0.01, 1 - t - b)
    fx, fy = lf * w, tf * h
    fw, fh_ = (1 - rf - lf) * w, (1 - bf - tf) * h
    wrap = {'position': 'absolute', 'left': f'{x}px', 'top': f'{y}px',
            'width': f'{w}px', 'height': f'{h}px', 'overflow': 'hidden'}
    if extra:
        wrap.update(extra)
    if blip_fill is not None:
        op = blip_opacity(blip_fill.find(A + 'blip'))
        if op is not None:
            wrap['opacity'] = round(op, 3)
    inner = {'position': 'absolute', 'left': f'{fx - (fw / vw) * l:.1f}px',
             'top': f'{fy - (fh_ / vh) * t:.1f}px', 'width': f'{fw / vw:.1f}px',
             'height': f'{fh_ / vh:.1f}px', 'maxWidth': 'none'}
    return (f'<div style={css(wrap)}>'
            f'<img src={{ASSET + {esc(src)}}} style={css(inner)} /></div>')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pptx', required=True)
    ap.add_argument('--theme', required=True)
    ap.add_argument('--slug', required=True)
    ap.add_argument('--title', default='Ported deck')
    ap.add_argument('--out', required=True)
    ap.add_argument('--react-pkg', default='react',
                    help="Especificador para importar React (ruta absoluta si el deck vive fuera del workspace)")
    a = ap.parse_args()

    z = zipfile.ZipFile(a.pptx)
    names = z.namelist()
    # scheme
    th = ET.fromstring(z.read('ppt/theme/theme1.xml'))
    scheme = {}
    for e in next(th.iter(A + 'clrScheme')):
        slot = e.tag.split('}')[1]
        ch = list(e)[0]
        scheme[slot] = ch.get('val') or ch.get('lastClr') or '000000'
    def theme_font(tag):
        for mf in th.iter(A + tag):
            lt = mf.find(A + 'latin')
            if lt is not None and lt.get('typeface'):
                return lt.get('typeface')
        return None
    ctx = Ctx(scheme, {'major': theme_font('majorFont'), 'minor': theme_font('minorFont')})
    # rels por slide para medios
    slide_names = sorted([n for n in names if re.fullmatch(r'ppt/slides/slide\d+\.xml', n)],
                         key=lambda n: int(re.search(r'\d+', n).group()))

    out_dir = a.out
    custom_dir = os.path.join(out_dir, 'custom')
    assets_dir = os.path.join(custom_dir, 'assets')
    os.makedirs(assets_dir, exist_ok=True)

    media_of = {}  # (slide, rId) -> filename

    def grab_media(n, idx):
        try:
            rels = ET.fromstring(z.read(n.replace('slides/slide', 'slides/_rels/slide') + '.rels'))
        except KeyError:
            return {}
        id2t = {e.get('Id'): e.get('Target') for e in rels.iter(R + 'Relationship')}
        m = {}
        for rid, t in id2t.items():
            if '/media/' in t:
                src = 'ppt/media/' + t.split('/')[-1]
                dst = f'slide-{idx}-{t.split("/")[-1]}'
                with open(os.path.join(assets_dir, dst), 'wb') as f2:
                    f2.write(z.read(src))
                m[rid] = dst
        return m

    comps = []
    for si, n in enumerate(slide_names, 1):
        idx = re.search(r'\d+', n).group()
        media = grab_media(n, idx)
        root = ET.fromstring(z.read(n))
        els = []
        order = 0
        skipped = []

        def shape_fill(sp_pr):
            fc = fill_css(sp_pr, ctx)
            if not fc:
                return {}
            return {'background': fc['background']}

        def render_sp(sp):
            nonlocal order
            nv = sp.find(f'{P}nvSpPr/{P}cNvPr')
            nm = nv.get('name') if nv is not None else '?'
            before = order
            sp_pr = sp.find(P + 'spPr')
            xfrm = sp_pr.find(A + 'xfrm') if sp_pr is not None else None
            if xfrm is None:
                return
            x, y, w, h, fh, fv, rot = xfrm_box(xfrm)
            # blipFill (imagen de fondo de forma)
            bf = sp_pr.find(A + 'blipFill') if sp_pr is not None else None
            blip = bf.find(A + 'blip') if bf is not None else None
            if blip is not None:
                rid = blip.get(RE + 'embed')
                if rid in media:
                    geom = sp_pr.find(A + 'prstGeom') if sp_pr is not None else None
                    extra = {}
                    if geom is not None and geom.get('prst') == 'roundRect':
                        extra['borderRadius'] = '24px'
                    els.append(img_el(media[rid], x, y, w, h, blip_fill=bf, extra=extra or None))
                    order += 1
                    # el texto va encima si existe
                    tx = compile_textbox(sp, ctx)
                    if tx:
                        els.append(text_div(tx, x, y, w, h))
                        order += 1
                    return
            # paths Bézier -> SVG
            cust = sp_pr.find(A + 'custGeom') if sp_pr is not None else None
            if cust is not None:
                ds = svg_path(cust, w, h)
                # Rectángulo real = 1 path con moveTo + 4-5 lnTo (close opcional).
                # Cualquier otro polígono (estrellas, blobs) va a SVG.
                paths = list(cust.iter(A + 'path'))
                cmds = [k.tag.split('}')[1] for k in list(paths[0])] if len(paths) == 1 else []
                is_rect = cmds in (['moveTo', 'lnTo', 'lnTo', 'lnTo', 'lnTo', 'close'],
                                   ['moveTo', 'lnTo', 'lnTo', 'lnTo', 'lnTo'])
                if not is_rect:
                    fill, defs = svg_fill(sp_pr, ctx, f'g{si}_{order}')
                    d_all = ' '.join(ds)
                    # borde de la forma (si lo hay)
                    stroke = ''
                    sln = sp_pr.find(A + 'ln')
                    if sln is not None and sln.find(A + 'noFill') is None:
                        slw = emu(sln.get('w', '12700'))
                        slc = sln.find(A + 'solidFill')
                        scc = resolve_color(slc[0], ctx) if slc is not None and len(slc) else None
                        if scc:
                            stroke = f' stroke={esc(scc)} stroke-width={esc(str(round(slw, 1)))}'
                    els.append(
                        f'<svg style={css(box(x, y, w, h))} viewBox={{`0 0 {w} {h}`}} preserveAspectRatio="none">'
                        f'{defs}<path d={esc(d_all)} fill={esc(fill)}{stroke} /></svg>')
                    order += 1
                    tx = compile_textbox(sp, ctx)
                    if tx:
                        els.append(text_div(tx, x, y, w, h))
                        order += 1
                    return
            # rect / resto
            bg = shape_fill(sp_pr)
            # línea
            ln = sp_pr.find(A + 'ln') if sp_pr is not None else None
            border = {}
            if ln is not None and ln.find(A + 'noFill') is None:
                lw = emu(ln.get('w', '12700'))
                lc = ln.find(A + 'solidFill')
                cc = resolve_color(lc[0], ctx) if lc is not None and len(lc) else None
                if cc:
                    border = {'border': f'{round(lw, 1)}px solid {cc}'}
            geom = sp_pr.find(A + 'prstGeom') if sp_pr is not None else None
            radius = {}
            if geom is not None and geom.get('prst') == 'ellipse':
                radius = {'borderRadius': '50%'}
            elif geom is not None and geom.get('prst') == 'roundRect':
                radius = {'borderRadius': '12px'}
            tx = compile_textbox(sp, ctx)
            if bg or border or radius or tx:
                if tx:
                    inner = text_inner(tx)
                    pad = tx['pad']
                    extra = {'background': 'transparent', 'display': 'flex',
                             'flexDirection': 'column', 'justifyContent': justify(tx),
                             'padding': f'{pad[2]}px {pad[1]}px {pad[3]}px {pad[0]}px',
                             'overflow': 'visible'}
                    if bg or border or radius:
                        extra.update(bg)
                        extra.update(border)
                        extra.update(radius)
                    els.append(f'<div style={css(box(x, y, w, h, rot, fh, fv, extra))}>{inner}</div>')
                else:
                    extra = {}
                    extra.update(bg)
                    extra.update(border)
                    extra.update(radius)
                    els.append(f'<div style={css(box(x, y, w, h, rot, fh, fv, extra))} />')
                order += 1
            if order == before:
                skipped.append(nm)

        def text_div(tx, x, y, w, h):
            pad = tx['pad']
            st = {'position': 'absolute', 'left': f'{x}px', 'top': f'{y}px',
                  'width': f'{w}px', 'height': f'{h}px', 'display': 'flex',
                  'flexDirection': 'column', 'justifyContent': justify(tx),
                  'padding': f'{pad[2]}px {pad[1]}px {pad[3]}px {pad[0]}px',
                  'overflow': 'visible'}
            return f'<div style={css(st)}>{text_inner(tx)}</div>'

        def text_inner(tx):
            out = []
            for pi, p in enumerate(tx['paras']):
                pst = {'textAlign': p['align'], 'marginTop': 0, 'marginBottom': 0}
                pst['lineHeight'] = p['ln'] if p['ln'] else 1.15
                # font-size en el <p>: el strut usa la fuente del bloque; si
                # queda en 16px por defecto, la unión strut+span supera al
                # line-height (+~3px/línea) y el texto se desborda.
                fs = 0.0
                for _, st in p['spans']:
                    m = re.match(r'([\d.]+)px', str(st.get('fontSize', '')))
                    if m:
                        fs = max(fs, float(m.group(1)))
                if fs:
                    pst['fontSize'] = f'{round(fs, 2)}px'
                else:
                    fs = 16.0
                # primera línea: LO arranca el texto más abajo que CSS cuando el
                # interlineado es holgado, y más arriba cuando es ajustado.
                # Ajuste empírico (ratio=pitch/fs): comp = fs*(0.70*ratio-0.783).
                # En ratio 1.4 equivale al half-leading clásico; con leading
                # negativo compensa hacia arriba. Salvo anchor centrado.
                if pi == 0 and (tx.get('anchor') or 't') != 'ctr':
                    lh = pst['lineHeight']
                    lh_px = float(str(lh).rstrip('px')) if isinstance(lh, str) else fs * float(lh)
                    ratio = lh_px / fs if fs else 1.0
                    comp = round(fs * (0.70 * ratio - 0.783), 2)
                    pst['marginTop'] = round((p['bfr'] or 0) + comp, 2)
                elif p['bfr']:
                    pst['marginTop'] = p['bfr']
                if p['bfr']:
                    pst['marginTop'] = p['bfr']
                if p['aft']:
                    pst['marginBottom'] = p['aft']
                if p['marL']:
                    pst['marginLeft'] = f'{emu(p["marL"])}px'
                if p['marR']:
                    pst['marginRight'] = f'{emu(p["marR"])}px'
                if p.get('indent'):
                    # sangría francesa: primera línea (viñeta) retrocede
                    pst['textIndent'] = f'{round(int(p["indent"]) / EMU_PER_PX, 1)}px'
                spans = ''.join(f'<span style={css(st)}>{jsx_text(t)}</span>'
                                for t, st in p['spans'])
                out.append(f'<p style={css(pst)}>{spans}</p>')
            return ''.join(out)

        def render_pic(pic):
            bf = pic.find(P + 'blipFill')
            blip = bf.find(A + 'blip') if bf is not None else None
            sp_pr = pic.find(P + 'spPr')
            xfrm = sp_pr.find(A + 'xfrm') if sp_pr is not None else None
            if blip is None or xfrm is None:
                return
            rid = blip.get(RE + 'embed')
            if rid not in media:
                return
            x, y, w, h, fh, fv, rot = xfrm_box(xfrm)
            geom = sp_pr.find(A + 'prstGeom') if sp_pr is not None else None
            extra = None
            if geom is not None and geom.get('prst') == 'roundRect':
                extra = {'borderRadius': '24px'}
            els.append(img_el(media[rid], x, y, w, h, blip_fill=bf, extra=extra,
                              rot=rot, fh=fh, fv=fv))

        def render_line(sp):
            sp_pr = sp.find(P + 'spPr')
            xfrm = sp_pr.find(A + 'xfrm') if sp_pr is not None else None
            ln = sp_pr.find(A + 'ln') if sp_pr is not None else None
            if xfrm is None or ln is None:
                return
            x, y, w, h, fh, fv, rot = xfrm_box(xfrm)
            lw = max(1, round(emu(ln.get('w', '12700')), 1))
            lc = ln.find(A + 'solidFill')
            cc = resolve_color(lc[0], ctx) if lc is not None and len(lc) else None
            if not cc:
                return
            x2 = x + (0 if fh else w)
            x1 = x + (w if fh else 0)
            y2 = y + (0 if fv else h)
            y1 = y + (h if fv else 0)
            st = {'position': 'absolute', 'left': f'{min(x, x + w)}px',
                  'top': f'{min(y, y + h)}px', 'width': f'{w}px',
                  'height': f'{max(h, lw)}px', 'overflow': 'visible'}
            els.append(
                f'<svg style={css(st)} '
                f'viewBox={{`0 0 {w} {max(h, lw)}`}} preserveAspectRatio="none">'
                f'<line x1={esc(str(round(x1 - min(x, x + w), 1)))} y1={esc(str(round(y1 - min(y, y + h), 1)))} '
                f'x2={esc(str(round(x2 - min(x, x + w), 1)))} y2={esc(str(round(y2 - min(y, y + h), 1)))} '
                f'stroke={esc(cc)} strokeWidth={esc(str(lw))} /></svg>')

        def walk(el, dx=0, dy=0, sx=1.0, sy=1.0):
            for ch in el:
                tag = ch.tag.split('}')[1]
                if tag == 'sp':
                    # aplicar offset de grupo envolviendo: reescribir xfrm temporalmente
                    if dx or dy or sx != 1.0 or sy != 1.0:
                        sp_pr = ch.find(P + 'spPr')
                        xfrm = sp_pr.find(A + 'xfrm') if sp_pr is not None else None
                        if xfrm is not None:
                            off = xfrm.find(A + 'off')
                            ext = xfrm.find(A + 'ext')
                            ox = int(off.get('x')) * sx + dx
                            oy = int(off.get('y')) * sy + dy
                            ow = int(ext.get('cx')) * sx
                            oh = int(ext.get('cy')) * sy
                            off.set('x', str(int(ox)))
                            off.set('y', str(int(oy)))
                            ext.set('cx', str(int(ow)))
                            ext.set('cy', str(int(oh)))
                    geom = ch.find(P + 'spPr/' + A + 'prstGeom') if ch.find(P + 'spPr') is not None else None
                    if geom is not None and geom.get('prst') == 'line':
                        render_line(ch)
                    else:
                        render_sp(ch)
                elif tag == 'pic':
                    render_pic(ch)
                elif tag == 'grpSp':
                    gsp = ch.find(P + 'grpSpPr')
                    if gsp is not None:
                        xfrm = gsp.find(A + 'xfrm')
                        if xfrm is not None:
                            off = xfrm.find(A + 'off')
                            ext = xfrm.find(A + 'ext')
                            choff = xfrm.find(A + 'chOff')
                            chext = xfrm.find(A + 'chExt')
                            if off is not None and ext is not None and choff is not None and chext is not None:
                                nsx = int(ext.get('cx')) / max(1, int(chext.get('cx')))
                                nsy = int(ext.get('cy')) / max(1, int(chext.get('cy')))
                                ndx = (int(off.get('x')) * sx + dx - int(choff.get('x')) * sx * nsx)
                                ndy = (int(off.get('y')) * sy + dy - int(choff.get('y')) * sy * nsy)
                                walk(ch, ndx, ndy, sx * nsx, sy * nsy)
                                continue
                    walk(ch, dx, dy, sx, sy)

        walk(root.find(P + 'cSld').find(P + 'spTree'))
        if skipped:
            print(f'slide {si}: omitidas {skipped}', file=sys.stderr)
        # fondo del slide (cSld/bg): sólido o degradado; si no hay, blanco
        bg_style = ''
        bg = root.find(P + 'cSld').find(P + 'bg')
        bgpr = bg.find(P + 'bgPr') if bg is not None else None
        if bgpr is not None:
            fc = fill_css(bgpr, ctx)
            if fc:
                bg_style = f", background: {json.dumps(fc['background'], ensure_ascii=False)}"
        comps.append((si, '\n'.join(els), bg_style))

    tsx = [f'import React from "{a.react_pkg}";', '',
           'const ASSET = "custom/assets/";', '',
           'const BG: React.CSSProperties = { position: "relative", width: 1280, height: 720, overflow: "hidden", background: "#ffffff" };', '']
    for si, body, bg_style in comps:
        tsx.append(f'export function Slide{si:02d}() {{')
        tsx.append('  return (')
        tsx.append(f'    <div style={{{{ ...BG{bg_style} }}}}>')
        for line in body.split('\n'):
            tsx.append('      ' + line)
        tsx.append('    </div>')
        tsx.append('  );')
        tsx.append('}')
        tsx.append('')
    with open(os.path.join(custom_dir, 'slides.tsx'), 'w') as f:
        f.write('\n'.join(tsx))

    cfg = [f"import {{ defineConfig }} from '@unsa/slides-kit';"]
    for si, _, _ in comps:
        cfg.append(f"import {{ Slide{si:02d} }} from './custom/slides';")
    cfg += ['', f'export default defineConfig({{',
            f"  title: {json.dumps(a.title, ensure_ascii=False)},",
            f"  slug: {json.dumps(a.slug)},",
            f"  theme: {json.dumps(a.theme)},",
            "  visibility: 'private',",
            '  slides: [']
    for si, _, _ in comps:
        cfg.append('    {')
        cfg.append("      layout: 'custom',")
        cfg.append(f'      component: Slide{si:02d},')
        cfg.append('    },')
    cfg += ['  ],', '});', '']
    with open(os.path.join(out_dir, 'deck.config.ts'), 'w') as f:
        f.write('\n'.join(cfg))
    print(f'{len(comps)} slides -> {custom_dir}/slides.tsx (+ deck.config.ts)')


if __name__ == '__main__':
    main()
