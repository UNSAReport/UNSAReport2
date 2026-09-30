import { createFileRoute, Link } from '@tanstack/react-router';
import {
  type LayoutCategory,
  type LayoutDefinition,
  listCategories,
  listLayouts,
} from '@unsa/slides-kit/layouts';
import { ThemeProvider } from '@unsa/slides-kit/renderer/ThemeProvider';
import { listThemes, type ThemeDefinition } from '@unsa/slides-kit/themes';
import { useId, useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { TextInput } from '@/components/TextInput';
import { previewSamples } from '@/lib/catalog-preview-samples';

export const Route = createFileRoute('/presentations/catalog')({
  component: PresentationsCatalog,
});

function PresentationsCatalog() {
  const themes = useMemo(() => listThemes(), []);
  const categories = useMemo(() => listCategories(), []);
  const allLayouts = useMemo(() => listLayouts(), []);

  const [selectedThemeId, setSelectedThemeId] = useState<string>('unsa-dark');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeInspectorLayout, setActiveInspectorLayout] =
    useState<LayoutDefinition | null>(null);

  const filteredLayouts = useMemo(() => {
    return allLayouts.filter((l: LayoutDefinition) => {
      if (selectedCategory !== 'all' && l.category !== selectedCategory) {
        return false;
      }
      if (search.trim()) {
        const query = search.toLowerCase();
        const inId = l.id.toLowerCase().includes(query);
        const inName = l.name.toLowerCase().includes(query);
        const inDesc = l.description.toLowerCase().includes(query);
        const inTags = l.tags.some((t: string) =>
          t.toLowerCase().includes(query),
        );
        if (!inId && !inName && !inDesc && !inTags) return false;
      }
      return true;
    });
  }, [allLayouts, selectedCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of allLayouts) {
      counts.set(l.category, (counts.get(l.category) || 0) + 1);
    }
    return counts;
  }, [allLayouts]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <div className="px-4 py-8 max-w-7xl mx-auto space-y-8">
        {/* Header and navigation */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/presentations"
                className="text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
              >
                ← Volver al Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Catálogo Oficial de Layouts y Temas
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              {allLayouts.length} layouts puros y modulares organizados en{' '}
              {categories.length} familias de diseño y {themes.length} temas.
            </p>
          </div>

          {/* Theme selector */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <fieldset className="flex flex-wrap items-center gap-2">
              <legend className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Tema de vista previa
              </legend>
              {themes.map((t: ThemeDefinition) => (
                <Button
                  key={t.id}
                  size="sm"
                  variant={selectedThemeId === t.id ? 'primary' : 'ghost'}
                  onClick={() => setSelectedThemeId(t.id)}
                  ariaPressed={selectedThemeId === t.id}
                >
                  {t.name}
                </Button>
              ))}
            </fieldset>
            <p className="text-[11px] text-slate-500">
              Se aplica a la vista previa completa dentro del modal.
            </p>
          </div>
        </header>

        {/* Search bar and category filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <fieldset className="flex flex-wrap items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <legend className="sr-only">Filtrar por categoría</legend>
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
                onClick={() => setSelectedCategory('all')}
                ariaPressed={selectedCategory === 'all'}
              >
                Todas ({allLayouts.length})
              </Button>
              {categories.map((cat: LayoutCategory) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? 'primary' : 'ghost'}
                  onClick={() => setSelectedCategory(cat)}
                  ariaPressed={selectedCategory === cat}
                  className="capitalize"
                >
                  {cat} ({categoryCounts.get(cat) || 0})
                </Button>
              ))}
            </fieldset>

            <div className="min-w-[240px]">
              <TextInput
                label="Buscar layouts"
                name="catalog-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por ID, nombre o tag…"
              />
            </div>
          </div>
        </div>

        {/* Layouts Grid */}
        <section aria-label="Lista de layouts">
          {filteredLayouts.length === 0 ? (
            <EmptyState
              titleId="catalog-empty-heading"
              title="No se encontraron layouts"
              body={
                <p>
                  Prueba con otro término de búsqueda o selecciona una categoría
                  distinta.
                </p>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLayouts.map((def: LayoutDefinition) => (
                <LayoutCatalogCard
                  key={def.id}
                  def={def}
                  onInspect={() => setActiveInspectorLayout(def)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Inspector Modal */}
        {activeInspectorLayout && (
          <LayoutInspectorModal
            def={activeInspectorLayout}
            selectedThemeId={selectedThemeId}
            onClose={() => setActiveInspectorLayout(null)}
          />
        )}
      </div>
    </div>
  );
}

function LayoutSchematic({ def }: { def: LayoutDefinition }) {
  const slots = def.slots.slice(0, 6);
  const overflow = def.slots.length - slots.length;
  return (
    <div aria-hidden="true" className="w-full h-full flex flex-col gap-2 p-1">
      {/* Bloque de título abstracto */}
      <div className="h-2.5 w-3/4 rounded bg-slate-700" />
      <div className="h-1.5 w-1/2 rounded bg-slate-800" />
      {/* Bloques por slot */}
      <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
        {slots.map((slot, i) =>
          slot.type.includes('[]') ? (
            <div
              key={slot.name}
              className={`rounded p-1.5 space-y-1 ${i === 0 ? 'bg-indigo-500/30 border border-indigo-500/40' : 'bg-slate-800 border border-slate-700/60'}`}
            >
              <div className="h-1 w-2/3 rounded bg-slate-700" />
              <div className="h-1 w-1/2 rounded bg-slate-700/70" />
              <div className="h-1 w-3/5 rounded bg-slate-700/50" />
            </div>
          ) : (
            <div
              key={slot.name}
              className={`rounded p-1.5 flex flex-col gap-1 ${i === 0 ? 'bg-indigo-500/30 border border-indigo-500/40' : 'bg-slate-800 border border-slate-700/60'}`}
            >
              <div className="h-1 w-1/2 rounded bg-slate-700" />
              <div className="h-1 w-3/4 rounded bg-slate-700/60" />
            </div>
          ),
        )}
      </div>
      {overflow > 0 ? (
        <p className="text-[10px] text-slate-500 font-mono">
          +{overflow} bloques más
        </p>
      ) : null}
    </div>
  );
}

function LayoutCatalogCard({
  def,
  onInspect,
}: {
  def: LayoutDefinition;
  onInspect: () => void;
}) {
  return (
    <Card
      padding="md"
      className="group flex flex-col justify-between hover:border-slate-700 hover:shadow-xl hover:shadow-indigo-950/20"
    >
      <header className="flex items-center justify-between gap-2 mb-3">
        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
          {def.category}
        </span>
        <Button size="sm" variant="ghost" onClick={onInspect}>
          Vista previa
        </Button>
      </header>

      {/* Schematic thumbnail */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-900 mb-4 p-3 select-none">
        <LayoutSchematic def={def} />
      </div>

      <div>
        <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
          {def.name}
        </h3>
        <p className="text-xs text-slate-400 font-mono mt-1 mb-3">{def.id}</p>
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
          {def.description}
        </p>
      </div>
    </Card>
  );
}

function LayoutInspectorModal({
  def,
  selectedThemeId,
  onClose,
}: {
  def: LayoutDefinition;
  selectedThemeId: string;
  onClose: () => void;
}) {
  const modalTitleId = useId();
  const Component = def.component;
  const sample = previewSamples[def.id] ?? {};

  // Props planas por SlotSchema: título/subtítulo/etiqueta + muestras del layout.
  const previewProps: Record<string, unknown> = {
    tag: def.category.toUpperCase(),
    title: def.name,
    subtitle: def.description,
    ...sample,
  };

  const sampleSnippet = `// En deck.config.ts
{
  layout: '${def.id}',
${def.slots
  .map(
    (s: LayoutDefinition['slots'][number]) =>
      `  ${s.name}: ${s.type === 'string' ? `'Texto de ejemplo'` : s.type === 'string[]' ? `['Item 1', 'Item 2']` : `{ /* ... */ }`}, // ${s.description}`,
  )
  .join('\n')}
}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div className="bg-slate-950 text-slate-200 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              {def.category}
            </span>
            <h2 id={modalTitleId} className="text-xl font-bold text-white">
              {def.name}
            </h2>
            <p className="text-xs font-mono text-slate-500">{def.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Vista previa con tema
          </h3>
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-800 select-none pointer-events-none">
            <ThemeProvider theme={selectedThemeId}>
              <div className="w-full h-full flex flex-col justify-center overflow-hidden text-[9px] leading-tight p-3">
                <Component {...previewProps} />
              </div>
            </ThemeProvider>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Descripción de Uso
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {def.description}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Slots Requeridos y Opcionales
          </h3>
          <div className="rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
            {def.slots.map((slot: LayoutDefinition['slots'][number]) => (
              <div
                key={slot.name}
                className="p-3 text-xs flex items-start justify-between gap-4"
              >
                <div>
                  <span className="font-mono font-bold text-indigo-400">
                    {slot.name}
                  </span>
                  {slot.required && (
                    <span className="ml-2 text-[10px] uppercase font-bold text-rose-400">
                      Requerido
                    </span>
                  )}
                  <p className="text-slate-400 mt-0.5">{slot.description}</p>
                </div>
                <span className="font-mono text-[11px] text-slate-500 shrink-0">
                  {slot.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Configuración en deck.config.ts
          </h3>
          <pre className="p-4 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
            {sampleSnippet}
          </pre>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
