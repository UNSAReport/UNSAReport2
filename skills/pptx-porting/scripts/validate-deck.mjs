#!/usr/bin/env node
// validate-deck.mjs — valida un deck.config.ts contra el kit sin renderizar:
// cuenta slides, verifica layouts/temas registrados y slots requeridos.
// Uso: validate-deck.mjs --deck demos/decks/azul-proposal-demo/deck.config.ts
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function args(argv) {
  const o = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--deck') o.deck = argv[++i];
    else if (argv[i] === '--kit') o.kit = argv[++i];
    else { console.error(`flag desconocida: ${argv[i]}`); process.exit(2); }
  }
  if (!o.deck) { console.error('requiere --deck PATH'); process.exit(2); }
  o.kit ??= 'packages/slides-kit/src';
  return o;
}

function main() {
  const o = args(process.argv);
  const src = readFileSync(o.deck, 'utf8');
  const theme = src.match(/theme:\s*['"]([^'"]+)['"]/)?.[1];
  // Divide por slides: cada bloque empieza en "layout:"
  const blocks = src.split(/(?=layout:\s*['"])/).slice(1);
  const { layoutRegistry } = require(`${process.cwd()}/${o.kit}/layouts/registry.ts`);
  const { themeRegistry } = require(`${process.cwd()}/${o.kit}/themes/registry.ts`);
  const errors = [];
  if (!themeRegistry.hasTheme(theme)) errors.push(`tema no registrado: ${theme}`);
  const rows = [];
  blocks.forEach((b, i) => {
    const id = b.match(/layout:\s*['"]([^'"]+)['"]/)?.[1] ?? `¿?#${i + 1}`;
    // 'custom' = slide 1:1 compilado (pptx-to-slides.py): sin slots de
    // catálogo; lo valida el loop visual, aquí basta theme + component.
    if (id === 'custom') {
      const ok = /component:\s*\w+/.test(b);
      if (!ok) errors.push(`slide ${i + 1} (custom): sin component`);
      rows.push({ slide: i + 1, layout: id, ok });
      return;
    }
    const def = layoutRegistry.getLayout(id);
    if (!def) {
      errors.push(`slide ${i + 1}: layout no registrado: ${id}`);
      rows.push({ slide: i + 1, layout: id, ok: false });
      return;
    }
    const missing = def.slots
      .filter((s) => s.required)
      .map((s) => s.name)
      .filter((n) => !new RegExp(`${n}\\s*:`).test(b));
    if (missing.length > 0) errors.push(`slide ${i + 1} (${id}): faltan slots: ${missing.join(', ')}`);
    rows.push({ slide: i + 1, layout: id, ok: missing.length === 0 });
  });
  console.log(`${o.deck}: tema=${theme} slides=${blocks.length} ok=${rows.filter((r) => r.ok).length}/${rows.length}`);
  for (const e of errors) console.error(`  FAIL ${e}`);
  process.exit(errors.length === 0 ? 0 : 1);
}
main();
