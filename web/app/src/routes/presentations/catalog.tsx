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
import { TextInput } from '@/components/TextInput';

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
    <ThemeProvider theme={selectedThemeId}>
      <div className="min-h-screen bg-[var(--slide-bg,#0b0f19)] text-[var(--slide-text,#f8fafc)] font-sans px-4 py-8 max-w-7xl mx-auto space-y-8 transition-colors duration-300">
        {/* Header and navigation */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-current/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/presentations"
                className="text-xs font-semibold opacity-60 hover:opacity-100 transition-opacity"
              >
                ← Volver al Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              Catálogo Oficial de Layouts y Temas
            </h1>
            <p className="text-sm opacity-70 mt-1 max-w-2xl">
              110 layouts puros y modulares organizados en 9 familias de diseño.
              Selecciona un tema para previsualizar la adaptación cromática en
              vivo.
            </p>
          </div>

          {/* Theme selector */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-current/5 border border-current/10">
            <fieldset className="flex flex-wrap items-center gap-2">
              <legend className="text-[11px] font-bold uppercase tracking-wider opacity-60 mb-1">
                Tema Activo:
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
          </div>
        </header>

        {/* Search bar and category filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <fieldset className="flex flex-wrap items-center gap-1.5">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLayouts.map((def: LayoutDefinition) => (
              <LayoutCatalogCard
                key={def.id}
                def={def}
                onInspect={() => setActiveInspectorLayout(def)}
              />
            ))}
          </div>
        </section>

        {/* Inspector Modal */}
        {activeInspectorLayout && (
          <LayoutInspectorModal
            def={activeInspectorLayout}
            onClose={() => setActiveInspectorLayout(null)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

function LayoutCatalogCard({
  def,
  onInspect,
}: {
  def: LayoutDefinition;
  onInspect: () => void;
}) {
  const Component = def.component;

  // Sample data to make the miniature layout visually render
  const sampleData: Record<string, unknown> = {
    tag: def.category.toUpperCase(),
    title: def.name,
    subtitle: def.description,
    author: 'UNSA Slides',
    stat: '100%',
    metric: '99.9%',
    label: 'Rendimiento',
    quote: 'La simplicidad es el requisito previo para la fiabilidad.',
    code: 'const deck = defineConfig({ theme: "unsa-dark" });',
    output: '✓ Ready in 42ms',
    left: { title: 'Lado Izquierdo', items: ['Punto 1', 'Punto 2'] },
    right: { title: 'Lado Derecho', items: ['Ventaja A', 'Ventaja B'] },
    featured: {
      stat: '1.2M',
      label: 'Operaciones',
      description: 'Por segundo',
    },
    cards: [
      { title: 'Métrica 1', stat: '42ms', status: 'optimal' },
      { title: 'Métrica 2', stat: '99.9%', status: 'optimal' },
      { title: 'Métrica 3', stat: '12 GB', status: 'normal' },
    ],
    items: ['Fase 1: Plan', 'Fase 2: Build', 'Fase 3: Deploy'],
  };

  return (
    <article className="group flex flex-col justify-between rounded-2xl bg-current/5 border border-current/10 hover:border-indigo-500/50 transition-all p-5 shadow-sm">
      <header className="flex items-center justify-between gap-2 mb-3">
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-current/10 text-indigo-400">
          {def.category}
        </span>
        <button
          type="button"
          onClick={onInspect}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Ver Slots ({def.slots.length})
        </button>
      </header>

      {/* Miniature preview viewport */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-current/10 bg-[var(--slide-bg,#0b0f19)] mb-4 flex items-center justify-center p-3 select-none pointer-events-none scale-95 group-hover:scale-100 transition-transform">
        <div className="w-full h-full flex flex-col justify-center overflow-hidden text-[9px] leading-tight">
          <Component data={sampleData} />
        </div>
      </div>

      <div>
        <h3 className="font-bold text-sm line-clamp-1">{def.name}</h3>
        <p className="text-xs font-mono opacity-50 mt-0.5 mb-2">{def.id}</p>
        <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">
          {def.description}
        </p>
      </div>
    </article>
  );
}

function LayoutInspectorModal({
  def,
  onClose,
}: {
  def: LayoutDefinition;
  onClose: () => void;
}) {
  const modalTitleId = useId();

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
      <div className="bg-[var(--slide-bg,#0b0f19)] border border-current/20 rounded-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-current/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              {def.category}
            </span>
            <h2 id={modalTitleId} className="text-xl font-bold">
              {def.name}
            </h2>
            <p className="text-xs font-mono opacity-50">{def.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg bg-current/10 hover:bg-current/20 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">
            Descripción de Uso
          </h3>
          <p className="text-sm opacity-80 leading-relaxed">
            {def.description}
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">
            Slots Requeridos y Opcionales
          </h3>
          <div className="rounded-xl border border-current/10 overflow-hidden divide-y divide-current/10">
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
                  <p className="opacity-70 mt-0.5">{slot.description}</p>
                </div>
                <span className="font-mono text-[11px] opacity-50 shrink-0">
                  {slot.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">
            Configuración en deck.config.ts
          </h3>
          <pre className="p-4 rounded-xl bg-black/60 border border-current/10 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre">
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
