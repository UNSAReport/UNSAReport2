#!/usr/bin/env python3
"""eot-extract.py — extrae las fuentes embebidas (EOT/.fntdata) de un .pptx.

PowerPoint embebe fuentes como Embedded OpenType en ppt/fonts/*.fntdata.
LibreOffice las usa al renderizar; si no se instalan, el loop visual compara
contra sustituciones distintas (p. ej. 'Open Sauce X' -> 'Open Sauce One'
embarcada vs 'Open Sauce Sans' del sistema) y la paridad es inalcanzable.

Uso:
  eot-extract.py --pptx plantilla.pptx --out ~/.local/share/fonts [--prefix deck-]
  fc-cache -f ~/.local/share/fonts   # después

Repara nameIDs 1/2/4/6 (familia/estilo) cuando el subset trae nombres legacy
rotos, preservando longitudes vía reconstrucción de la tabla 'name'.
"""
import argparse
import os
import struct
import sys
import zipfile


def read_names(data):
    n = struct.unpack('>H', data[4:6])[0]
    tabs = {}
    for i in range(n):
        tag, _, off, ln = struct.unpack('>4sLLL', data[12 + i * 16:12 + i * 16 + 16])
        tabs[tag] = (off, ln)
    return tabs


def split_ps_name(ps):
    """'OpenSauceOne-Bold' -> ('Open Sauce One', 'Bold')."""
    import re
    base = ps
    style = 'Regular'
    m = re.match(r'^(.*?)-(Black|Bold|Light|Medium|Regular|SemiBold|Normal|Italic|BoldItalic)$', ps)
    if m:
        base, style = m.group(1), m.group(2)
        if style == 'Normal':
            style = 'Regular'
    fam = re.sub(r'(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])', ' ', base)
    return fam, style


def ttf_family_style(data):
    """Devuelve (familia tipográfica, estilo) priorizando nameIDs 16/17."""
    tabs = read_names(data)
    off, _ = tabs[b'name']
    _, count, stroff = struct.unpack('>HHH', data[off:off + 6])
    vals = {}
    for i in range(count):
        plat, enc, lang, nid, ln2, so = struct.unpack(
            '>HHHHHH', data[off + 6 + i * 12:off + 18 + i * 12])
        raw = data[off + stroff + so:off + stroff + so + ln2]
        for dec in ('utf-16-be', 'mac-roman', 'latin-1'):
            try:
                t = raw.decode(dec)
                if t and all(c.isprintable() or c == ' ' for c in t):
                    vals.setdefault((nid, plat), t)
                    break
            except Exception:
                continue
    if (16, 3) in vals or (16, 1) in vals:
        fam = vals.get((16, 3)) or vals.get((16, 1))
        sty = vals.get((17, 3)) or vals.get((17, 1)) or 'Regular'
        return fam.strip(), sty.strip()
    # sin IDs tipográficos: derivar del nombre PostScript (ID 6)
    ps = vals.get((6, 3)) or vals.get((6, 1)) or ''
    if ps:
        return split_ps_name(ps.strip())
    fam = vals.get((1, 3)) or vals.get((1, 1)) or 'Unknown'
    sty = vals.get((2, 3)) or vals.get((2, 1)) or 'Regular'
    return fam.strip(), sty.strip()


def rebuild_names(data, family, style):
    """Reescribe nameIDs 1/2/4/6 (plats 1 y 3) con valores sanos."""
    repl = {1: family, 2: style, 4: family + ' ' + style,
            6: family.replace(' ', '') + '-' + style.replace(' ', '')}
    d = bytearray(data)
    n = struct.unpack('>H', d[4:6])[0]
    diroff = 12
    name_idx = None
    for i in range(n):
        tag, _, off, ln = struct.unpack('>4sLLL', d[diroff + i * 16:diroff + i * 16 + 16])
        if tag == b'name':
            name_idx = i
            name_off, name_len = off, ln
    assert name_idx is not None, 'sin tabla name'
    fmt, count, stroff = struct.unpack('>HHH', d[name_off:name_off + 6])
    recs = []
    for i in range(count):
        plat, enc, lang, nid, ln2, so = struct.unpack(
            '>HHHHHH', d[name_off + 6 + i * 12:name_off + 18 + i * 12])
        raw = bytes(d[name_off + stroff + so:name_off + stroff + so + ln2])
        recs.append([plat, enc, lang, nid, raw])
    for r in recs:
        plat, enc, lang, nid, raw = r
        if nid in repl and plat in (1, 3):
            txt = repl[nid]
            if plat == 1 and enc == 0:
                encb = txt.encode('mac-roman')
            elif nid == 6:
                encb = txt.encode('ascii')
            else:
                encb = txt.encode('utf-16-be')
            r[4] = encb
    blob = b''
    newrecs = []
    for plat, enc, lang, nid, raw in recs:
        newrecs.append((plat, enc, lang, nid, len(raw), len(blob)))
        blob += raw
    while len(blob) % 4:
        blob += b'\x00'
    newtab = (struct.pack('>HHH', fmt, count, 6 + 12 * count)
              + b''.join(struct.pack('>HHHHHH', *r) for r in newrecs) + blob)
    if len(newtab) <= name_len:
        d[name_off:name_off + len(newtab)] = newtab
    else:
        new_off = len(d)
        while new_off % 4:
            new_off += 1
            d.append(0)
        d += newtab
        struct.pack_into('>LL', d, diroff + name_idx * 16 + 8, new_off, len(newtab))
    return bytes(d)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pptx', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--prefix', default='')
    ap.add_argument('--no-repair-names', action='store_true')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    z = zipfile.ZipFile(a.pptx)
    found = 0
    for n in sorted(z.namelist()):
        if '/fonts/' not in n or not n.endswith('.fntdata'):
            continue
        d = z.read(n)
        eot_size, font_size = struct.unpack('<LL', d[:8])
        if eot_size != len(d):
            print(f'aviso: {n}: eotSize incoherente, se omite', file=sys.stderr)
            continue
        payload = d[eot_size - font_size:]
        if payload[:4] not in (b'\x00\x01\x00\x00', b'OTTO', b'true', b'typ1'):
            print(f'aviso: {n}: payload no TTF/OTF, se omite', file=sys.stderr)
            continue
        fam, sty = ttf_family_style(payload)
        if not a.no_repair_names:
            payload = rebuild_names(payload, fam, sty)
        safe = ''.join(c if (c.isalnum() or c in '-_') else '_' for c in f'{fam}-{sty}')
        dst = os.path.join(a.out, f'{a.prefix}{safe}.ttf')
        with open(dst, 'wb') as f2:
            f2.write(payload)
        print(f'{n} -> {dst} ({fam} / {sty})')
        found += 1
    if not found:
        print('sin fuentes embebidas en el .pptx')
    else:
        print(f'{found} fuentes extraídas; ejecuta: fc-cache -f {a.out}')


if __name__ == '__main__':
    main()
