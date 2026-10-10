#!/usr/bin/env node
// pptx-shot.mjs — .pptx → PNGs 1280×720 por slide (un PNG por slide).
// Requiere: soffice (LibreOffice) + pdftoppm (poppler).
// Uso: pptx-shot.mjs --pptx FILE.pptx --out DIR [--width 1280] [--height 720]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, renameSync, rmSync, mkdirSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';

function args(argv) {
  const o = { width: 1280, height: 720 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--pptx') o.pptx = argv[++i];
    else if (k === '--out') o.out = argv[++i];
    else if (k === '--width') o.width = Number(argv[++i]);
    else if (k === '--height') o.height = Number(argv[++i]);
    else { console.error(`flag desconocida: ${k}`); process.exit(2); }
  }
  if (!o.pptx || !o.out) { console.error('requiere --pptx FILE --out DIR'); process.exit(2); }
  return o;
}
function need(bin, hint) {
  try {
    execFileSync(bin, bin === 'soffice' ? ['--version'] : ['-h'], { stdio: 'ignore' });
  } catch {
    console.error(`falta ${bin}: ${hint}`);
    process.exit(3);
  }
}

function main() {
  const o = args(process.argv);
  need('soffice', 'instala LibreOffice (https://www.libreoffice.org/)');
  need('pdftoppm', 'instala poppler-utils');
  const outDir = resolve(o.out);
  mkdirSync(outDir, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), 'pptx-shot-'));
  try {
    execFileSync('soffice', ['--headless', '--convert-to', 'pdf', '--outdir', tmp, resolve(o.pptx)], { stdio: 'inherit' });
    const pdfs = readdirSync(tmp).filter((f) => f.toLowerCase().endsWith('.pdf'));
    if (pdfs.length !== 1) throw new Error(`conversión ambigua: ${pdfs.join(', ')}`);
    const base = join(outDir, 'page');
    execFileSync('pdftoppm', ['-png', '-scale-to-x', String(o.width), '-scale-to-y', String(o.height),
      join(tmp, pdfs[0]), base], { stdio: 'inherit' });
    const pages = readdirSync(outDir)
      .map((f) => f.match(/^page-(\d+)\.png$/))
      .filter(Boolean)
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b);
    for (const n of pages) {
      renameSync(join(outDir, `page-${n}.png`), join(outDir, `slide-${String(n).padStart(2, '0')}.png`));
    }
    console.log(`${basename(o.pptx)}: ${pages.length} slides → ${outDir}/slide-NN.png (${o.width}x${o.height})`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
main();
