#!/usr/bin/env node
// unsa-shot.mjs — renderiza un deck.config.ts slide por slide (SSR) y los
// captura a PNGs 1280×720 con Chromium headless. Sin dependencias extra.
// Uso: unsa-shot.mjs --deck demos/decks/azul-proposal-demo/deck.config.ts --out shots/azul-proposal-unsa/ [--chrome PATH]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';

function args(argv) {
  const o = { width: 1280, height: 720 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--deck') o.deck = argv[++i];
    else if (k === '--out') o.out = argv[++i];
    else if (k === '--chrome') o.chrome = argv[++i];
    else if (k === '--width') o.width = Number(argv[++i]);
    else if (k === '--height') o.height = Number(argv[++i]);
    else { console.error(`flag desconocida: ${k}`); process.exit(2); }
  }
  if (!o.deck || !o.out) { console.error('requiere --deck PATH --out DIR'); process.exit(2); }
  o.chrome ??= `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`;
  return o;
}

async function main() {
  const o = args(process.argv);
  const root = process.cwd();
  const kitRequire = createRequire(join(root, 'packages/slides-kit/package.json'));
  const React = kitRequire('react');
  const { renderToStaticMarkup } = kitRequire('react-dom/server');
  const { ThemeProvider } = await import(join(root, 'packages/slides-kit/src/renderer/ThemeProvider.tsx'));
  const { SlideRenderer } = await import(join(root, 'packages/slides-kit/src/renderer/SlideRenderer.tsx'));

  // Carga el deck sin resolver '@unsa/slides-kit': defineConfig local.
  // Los imports relativos se absolutizan al dir del deck.
  const deckDir = dirname(resolve(o.deck));
  const src = readFileSync(resolve(o.deck), 'utf8');
  const body = src
    .replace(
      /import\s*\{[^}]*\}\s*from\s*['"]@unsa\/slides-kit['"];?/,
      'const defineConfig=(x)=>x;',
    )
    .replace(/from\s*['"]\.\//g, `from '${deckDir}/`);
  const tmp = join(tmpdir(), `deck-${Date.now()}.mjs`);
  writeFileSync(tmp, body);
  const deck = (await import(tmp)).default;
  const slides = deck.slides ?? [];
  if (slides.length === 0) { console.error('deck sin slides'); process.exit(2); }

  const outDir = resolve(o.out);
  mkdirSync(outDir, { recursive: true });
  const htmlDir = join(outDir, '.html');
  mkdirSync(htmlDir, { recursive: true });
  // Activos del deck (custom/assets) junto al HTML para file://.
  // Se preserva el prefijo custom/ para que coincida con el modo dev (Vite).
  const { cpSync, existsSync } = await import('node:fs');
  const deckAssets = join(dirname(resolve(o.deck)), 'custom', 'assets');
  if (existsSync(deckAssets)) {
    cpSync(deckAssets, join(htmlDir, 'custom', 'assets'), { recursive: true });
  }
  slides.forEach((slide, i) => {
    const { layout, notes, ...props } = slide;
    const el = React.createElement(
      ThemeProvider,
      { theme: deck.theme },
      React.createElement(SlideRenderer, { slide: { layout, ...props }, index: i, theme: deck.theme }),
    );
    const html = renderToStaticMarkup(el);
    const page = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">` +
      `<script src="https://cdn.tailwindcss.com"></script>` +
      `<style>html,body{margin:0;padding:0;overflow:hidden;background:#000}` +
      `#stage{width:${o.width}px;height:${o.height}px;overflow:hidden;position:relative}` +
      `pre,code{font-family:var(--slide-mono-family)}` +
      `h1,h2,h3,h4,h5,h6{font-weight:var(--slide-heading-weight)}</style></head>` +
      `<body><div id="stage">${html}</div></body></html>`;
    writeFileSync(join(htmlDir, `slide-${String(i + 1).padStart(2, '0')}.html`), page);
  });
  for (let i = 0; i < slides.length; i++) {
    const name = `slide-${String(i + 1).padStart(2, '0')}`;
    execFileSync(o.chrome, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--window-size=${o.width},${o.height}`,
      `--screenshot=${join(outDir, `${name}.png`)}`,
      '--virtual-time-budget=10000',
      `file://${join(htmlDir, `${name}.html`)}`,
    ], { stdio: 'ignore' });
  }
  console.log(`${deck.theme}: ${slides.length} slides → ${outDir}/slide-NN.png (${o.width}x${o.height})`);
}
main().catch((e) => { console.error(e); process.exit(1); });
