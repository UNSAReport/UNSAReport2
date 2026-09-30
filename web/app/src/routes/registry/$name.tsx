import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
  useChildMatches,
} from '@tanstack/react-router';
import { buttonClasses } from '@/components/Button';
import { Card } from '@/components/Card';
import {
  fetchPackageServerFn,
  fetchVersionServerFn,
  fetchVersionsServerFn,
  type RegistryVersionDetail,
} from '@/lib/registry/client';

export const Route = createFileRoute('/registry/$name')({
  loader: async ({ params }) => {
    const name = params.name;
    try {
      const pkg = await fetchPackageServerFn({ data: { name } });
      const versions = await fetchVersionsServerFn({ data: { name } }).catch(
        () => [],
      );
      let latestVersionDetail: RegistryVersionDetail | null = null;
      if (pkg.latestVersion) {
        latestVersionDetail = await fetchVersionServerFn({
          data: { name, version: pkg.latestVersion },
        }).catch(() => null);
      }
      return { pkg, versions, latestVersionDetail };
    } catch {
      throw notFound();
    }
  },
  component: PackageComponent,
});

function PackageComponent() {
  const { pkg, versions, latestVersionDetail } = Route.useLoaderData();
  const childMatches = useChildMatches();
  const hasChildMatch = childMatches.length > 0;

  const isScoped = pkg.name.startsWith('@') && pkg.name.includes('/');
  const scopePart = isScoped ? pkg.name.split('/')[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      <header className="border-b border-slate-700/60 pb-6">
        <Link
          to="/registry"
          search={{ search: undefined, tag: undefined }}
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          ← Volver a paquetes
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
          {pkg.displayName || pkg.name}
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">{pkg.name}</p>
        {pkg.description && (
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            {pkg.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {scopePart && (
            <Link
              to="/scopes/$scope"
              params={{ scope: scopePart }}
              className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono hover:text-indigo-200"
            >
              {scopePart}
            </Link>
          )}
          {pkg.tags?.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]"
            >
              {t}
            </span>
          ))}
          {pkg.latestVersion && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-mono">
              v{pkg.latestVersion}
            </span>
          )}
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Versiones</h2>
        {versions.length === 0 ? (
          <p className="text-sm text-slate-500 italic">Sin versiones</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {versions.map((v) => (
              <Card
                key={v.version}
                padding="md"
                className="flex items-center justify-between gap-4 hover:border-slate-700"
              >
                <div>
                  <p className="text-sm font-bold text-white font-mono">
                    v{v.version}
                    {v.version === pkg.latestVersion && (
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-sans">
                        actual
                      </span>
                    )}
                  </p>
                  {v.fileCount !== undefined && (
                    <p className="text-xs text-slate-500 mt-1">
                      {v.fileCount} archivo(s)
                    </p>
                  )}
                  <div className="mt-3 inline-block bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300">
                    unsarep install {pkg.name}@{v.version}
                  </div>
                </div>
                <Link
                  to="/registry/$name/$version"
                  params={{ name: pkg.name, version: v.version }}
                  className={buttonClasses('secondary', 'sm')}
                >
                  Ver
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Outlet />

      {!hasChildMatch && (
        <section className="space-y-4">
          {latestVersionDetail ? (
            <Card padding="md">
              <h2 className="text-lg font-bold text-white">
                Última versión (v{latestVersionDetail.version})
              </h2>
              <div className="mt-3 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300">
                unsarep install {pkg.name}@{latestVersionDetail.version}
              </div>
              {latestVersionDetail.archive_url && (
                <p className="mt-3">
                  <a
                    href={latestVersionDetail.archive_url}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonClasses('secondary', 'sm')}
                  >
                    Descargar archivo
                  </a>
                </p>
              )}
              <h3 className="text-sm font-semibold text-slate-200 mt-6 mb-2">
                Archivos ({latestVersionDetail.files.length})
              </h3>
              {latestVersionDetail.files.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Sin archivos</p>
              ) : (
                <ul className="space-y-1.5">
                  {latestVersionDetail.files.map((f) => (
                    <li key={f.path} className="text-sm text-slate-400">
                      <code className="font-mono text-xs text-slate-200">
                        {f.path}
                      </code>{' '}
                      <span className="text-xs text-slate-500">
                        ({f.size} bytes)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : (
            <Card padding="md">
              <h2 className="text-lg font-bold text-white">Archivos</h2>
              <p className="text-sm text-slate-500 italic mt-2">Sin archivos</p>
            </Card>
          )}
        </section>
      )}
    </div>
  );
}
