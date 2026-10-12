#!/usr/bin/env node
// compare.mjs — SSIM + pixel-diff por par de PNGs, sin dependencias.
// Uso: compare.mjs --ref DIR --got DIR [--threshold 0.90] [--out JSON] [--md MD] [--diff DIR]
//          [--tiers TIERS.json] [--tier-b-max 25]
// Gate de dos niveles (ver skills/pptx-porting/references/visual-loop.md):
//   Tier A (vectorial/texto): SSIM >= umbral Y pixdiff <= (1-umbral)*100.
//   Tier B (fotográfico): SSIM >= umbral Y pixdiff <= tier-b-max. Solo para
//   slides con cobertura raster >=30% (TIERS.json audita cada slide). El
//   pipeline JPEG+resample de LibreOffice impone un piso de ruido ~15-20%
//   en fotos/washes que ningún render puede bajar (verificado con los bytes
//   exactos del PDF).
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { inflateSync, deflateSync } from 'node:zlib';

function args(argv) {
  const o = { threshold: 0.90, tierBMax: 25 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--threshold') o.threshold = Number(argv[++i]);
    else if (k === '--ref') o.ref = argv[++i];
    else if (k === '--got') o.got = argv[++i];
    else if (k === '--out') o.out = argv[++i];
    else if (k === '--md') o.md = argv[++i];
    else if (k === '--diff') o.diff = argv[++i];
    else if (k === '--tiers') o.tiers = argv[++i];
    else if (k === '--tier-b-max') o.tierBMax = Number(argv[++i]);
    else { console.error(`flag desconocida: ${k}`); process.exit(2); }
  }
  if (!o.ref || !o.got) { console.error('requiere --ref DIR --got DIR'); process.exit(2); }
  if (!(o.threshold > 0 && o.threshold <= 1)) { console.error('--threshold debe estar en (0,1]'); process.exit(2); }
  return o;
}

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function readPNG(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${path}: no es PNG`);
  let w = 0, h = 0, depth = 0, color = 0, interlace = 0;
  const idat = [];
  let pos = 8;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; color = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8 || (color !== 2 && color !== 6)) throw new Error(`${path}: solo PNG 8-bit RGB/RGBA`);
  if (interlace !== 0) throw new Error(`${path}: sin soporte Adam7`);
  const ch = color === 2 ? 3 : 4;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const rgb = Buffer.alloc(w * h * 3);
  let p = 0;
  const prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[p++];
    const cur = Buffer.alloc(stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev[i], c = i >= ch ? prev[i - ch] : 0;
      let v = raw[p++];
      if (f === 1) v = (v + a) & 0xff;
      else if (f === 2) v = (v + b) & 0xff;
      else if (f === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (f === 4) v = (v + paeth(a, b, c)) & 0xff;
      cur[i] = v;
    }
    for (let x = 0; x < w; x++) {
      rgb[(y * w + x) * 3] = cur[x * ch];
      rgb[(y * w + x) * 3 + 1] = cur[x * ch + 1];
      rgb[(y * w + x) * 3 + 2] = cur[x * ch + 2];
    }
    prev.set(cur);
  }
  return { width: w, height: h, rgb };
}

function writePNG(path, w, h, rgb) {
  const stride = w * 3;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}

function toGray({ width, height, rgb }) {
  const g = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) {
    g[i] = 0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
  }
  return { width, height, g };
}
function downscale(img, maxW) {
  if (img.width <= maxW) return img;
  const s = maxW / img.width;
  const w = maxW, h = Math.max(1, Math.round(img.height * s));
  const out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = Math.min(img.width - 1, Math.floor(x / s));
      const sy = Math.min(img.height - 1, Math.floor(y / s));
      out[y * w + x] = img.g[sy * img.width + sx];
    }
  }
  return { width: w, height: h, g: out };
}
const GAUSS = (() => {
  const k = [], sigma = 1.5;
  let sum = 0;
  for (let i = -5; i <= 5; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    k.push(v); sum += v;
  }
  return k.map((v) => v / sum);
})();
function ssim(a, b) {
  const { width: w, height: h } = a;
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2;
  let acc = 0, n = 0;
  for (let y = 0; y + 11 <= h; y += 4) {
    for (let x = 0; x + 11 <= w; x += 4) {
      let mu1 = 0, mu2 = 0;
      for (let j = 0; j < 11; j++) {
        for (let i = 0; i < 11; i++) {
          const wt = GAUSS[i] * GAUSS[j];
          mu1 += wt * a.g[(y + j) * w + x + i];
          mu2 += wt * b.g[(y + j) * w + x + i];
        }
      }
      let s1 = 0, s2 = 0, sc = 0;
      for (let j = 0; j < 11; j++) {
        for (let i = 0; i < 11; i++) {
          const wt = GAUSS[i] * GAUSS[j];
          const d1 = a.g[(y + j) * w + x + i] - mu1;
          const d2 = b.g[(y + j) * w + x + i] - mu2;
          s1 += wt * d1 * d1; s2 += wt * d2 * d2; sc += wt * d1 * d2;
        }
      }
      acc += ((2 * mu1 * mu2 + C1) * (2 * sc + C2)) / ((mu1 * mu1 + mu2 * mu2 + C1) * (s1 + s2 + C2));
      n++;
    }
  }
  return n === 0 ? 0 : acc / n;
}

function main() {
  const o = args(process.argv);
  const files = readdirSync(o.ref).filter((f) => f.toLowerCase().endsWith('.png')).sort();
  if (files.length === 0) { console.error(`sin PNG en ${o.ref}`); process.exit(2); }
  if (o.diff) mkdirSync(o.diff, { recursive: true });
  let tiers = {};
  if (o.tiers) tiers = JSON.parse(readFileSync(o.tiers, 'utf8'));
  const pairs = [];
  for (const f of files) {
    const rp = join(o.ref, f), gp = join(o.got, f);
    if (!existsSync(gp)) {
      pairs.push({ slide: f, ssim: 0, pixelDiffPct: 100, pass: false, note: 'falta en got' });
      continue;
    }
    const r = readPNG(rp), g = readPNG(gp);
    if (r.width !== g.width || r.height !== g.height) {
      pairs.push({ slide: f, ssim: 0, pixelDiffPct: 100, pass: false, note: `tamaño ${r.width}x${r.height} vs ${g.width}x${g.height}` });
      continue;
    }
    const s = ssim(downscale(toGray(r), 480), downscale(toGray(g), 480));
    let diff = 0;
    for (let i = 0; i < r.width * r.height; i++) {
      const d = Math.abs(r.rgb[i * 3] - g.rgb[i * 3]) + Math.abs(r.rgb[i * 3 + 1] - g.rgb[i * 3 + 1]) + Math.abs(r.rgb[i * 3 + 2] - g.rgb[i * 3 + 2]);
      if (d > 48) diff++;
    }
    const pct = (100 * diff) / (r.width * r.height);
    const tier = tiers[f] === 'B' ? 'B' : 'A';
    const passA = s >= o.threshold && pct <= (1 - o.threshold) * 100;
    const passB = tier === 'B' && s >= o.threshold && pct <= o.tierBMax;
    const pass = passA || passB;
    const passVia = passA ? 'A' : passB ? 'B' : null;
    if (o.diff) {
      const out = Buffer.alloc(r.rgb.length);
      for (let i = 0; i < r.width * r.height; i++) {
        const d = Math.abs(r.rgb[i * 3] - g.rgb[i * 3]) + Math.abs(r.rgb[i * 3 + 1] - g.rgb[i * 3 + 1]) + Math.abs(r.rgb[i * 3 + 2] - g.rgb[i * 3 + 2]);
        if (d > 48) { out[i * 3] = 255; out[i * 3 + 1] = 0; out[i * 3 + 2] = 0; }
        else {
          const v = Math.round((r.rgb[i * 3] + r.rgb[i * 3 + 1] + r.rgb[i * 3 + 2]) / 3);
          out[i * 3] = v; out[i * 3 + 1] = v; out[i * 3 + 2] = v;
        }
      }
      writePNG(join(o.diff, f.replace(/\.png$/i, '.diff.png')), r.width, r.height, out);
    }
    pairs.push({ slide: f, tier, ssim: Math.round(s * 10000) / 10000, pixelDiffPct: Math.round(pct * 100) / 100, pass, passVia });
  }
  const passed = pairs.filter((p) => p.pass).length;
  const passedA = pairs.filter((p) => p.passVia === 'A').length;
  const passedB = pairs.filter((p) => p.passVia === 'B').length;
  const report = {
    threshold: o.threshold,
    tierBMax: o.tierBMax,
    tiers: o.tiers ?? null,
    pairs,
    summary: {
      total: pairs.length,
      passed,
      passedA,
      passedB,
      ssimMin: Math.min(...pairs.map((p) => p.ssim)),
      pixelDiffMax: Math.max(...pairs.map((p) => p.pixelDiffPct)),
    },
  };
  if (o.out) writeFileSync(o.out, JSON.stringify(report, null, 2) + '\n');
  if (o.md) {
    const rows = pairs.map((p) => `| ${p.slide} | ${p.tier} | ${p.ssim} | ${p.pixelDiffPct}% | ${p.pass ? `PASS-${p.passVia}` : 'FAIL'} |`).join('\n');
    writeFileSync(o.md, `# Comparación visual (umbral ${o.threshold}, Tier B máx ${o.tierBMax}%)\n\n${passed}/${pairs.length} pares PASS (A: ${passedA}, B: ${passedB}) · SSIM mín ${report.summary.ssimMin} · dif máx ${report.summary.pixelDiffMax}%\n\n| slide | tier | SSIM | dif píxeles | veredicto |\n|---|---|---|---|---|\n${rows}\n`);
  }
  console.log(`${basename(o.ref)} vs ${basename(o.got)}: ${passed}/${pairs.length} PASS (A: ${passedA}, B: ${passedB}, umbral ${o.threshold})`);
  process.exit(passed === pairs.length ? 0 : 1);
}
main();
