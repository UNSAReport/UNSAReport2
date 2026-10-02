import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
  useChildMatches,
} from '@tanstack/react-router';
import { buttonClasses } from '@/components/Button';
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
    <div className="min-h-screen bg-[#E3E2DE] text-[#141414] font-sans">
      {/* HERO */}
      <section className="grid grid-cols-12 border-b border-[#C7C7C7]">
        <div className="col-span-12 md:col-span-3 md:border-r border-b md:border-b-0 border-[#C7C7C7] p-6 flex md:flex-col flex-row items-center md:items-start gap-4">
          <span aria-hidden="true" className="block w-4 h-4 bg-[#141414]" />
          <p className="grid-label">Package</p>
          <p className="md:mt-auto font-mono text-[11px] text-[#7A7A7A]">
            {versions.length}{' '}
            {versions.length === 1 ? 'versión' : 'versiones'}
          </p>
        </div>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12 flex flex-col justify-center gap-6">
          <Link
            to="/registry"
            search={{ search: undefined, tag: undefined }}
            className="text-xs font-bold uppercase tracking-[0.2em] text-[#444343] transition-colors duration-300 hover:text-[#1351AA]"
          >
            ← Volver a paquetes
          </Link>
          <h1 className="poster-headline uppercase text-5xl md:text-7xl break-words">
            {pkg.displayName || pkg.name}
          </h1>
          <p className="text-xs text-[#7A7A7A] font-mono">{pkg.name}</p>
          {pkg.description && (
            <p className="text-base text-[#444343] max-w-xl leading-relaxed">
              {pkg.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {scopePart && (
              <Link
                to="/scopes/$scope"
                params={{ scope: scopePart }}
                className="px-2 py-0.5 rounded-none bg-[#141414] text-[#E3E2DE] text-[11px] font-mono transition-colors duration-300 hover:text-[#1351AA]"
              >
                {scopePart}
              </Link>
            )}
            {pkg.tags?.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-none border border-[#C7C7C7] text-[#444343] text-[11px] font-bold uppercase tracking-wider"
              >
                {t}
              </span>
            ))}
            {pkg.latestVersion && (
              <span className="px-2 py-0.5 rounded-none bg-[#141414] text-[#E3E2DE] text-[11px] font-mono">
                v{pkg.latestVersion}
              </span>
            )}
          </div>
          <code className="block p-3 rounded-none bg-[#141414] text-[#E3E2DE] border border-[#C7C7C7] font-mono text-xs overflow-x-auto max-w-xl">
            unsarep install {pkg.name}@{pkg.latestVersion ?? 'latest'}
          </code>
        </div>
      </section>

      {/* VERSIONS — typographic list */}
      <section className="grid grid-cols-12 border-b border-[#C7C7C7]">
        <div className="col-span-12 md:col-span-3 p-6 md:border-r border-b md:border-b-0 border-[#C7C7C7]">
          <p className="grid-label md:sticky md:top-32">
            Versions — {String(versions.length).padStart(3, '0')}
          </p>
        </div>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12">
          {versions.length === 0 ? (
            <p className="text-sm text-[#7A7A7A] italic">Sin versiones</p>
          ) : (
            <div>
              {versions.map((v, i) => (
                <div
                  key={v.version}
                  className="poster-row min-h-[100px] items-center"
                >
                  <p className="font-mono text-xs text-[#7A7A7A] shrink-0 w-10">
                    {String(i + 1).padStart(3, '0')}
                  </p>
                  <div className="flex-1 min-w-0">
                    <p className="poster-row-title text-3xl md:text-4xl font-bold leading-none tracking-tight font-mono">
                      v{v.version}
                      {v.version === pkg.latestVersion && (
                        <span className="ml-3 align-middle px-2 py-0.5 rounded-none bg-transparent text-green-700 border border-[#C7C7C7] text-[11px] font-sans font-bold uppercase tracking-wider">
                          actual
                        </span>
                      )}
                    </p>
                    {v.fileCount !== undefined && (
                      <p className="text-xs text-[#7A7A7A] mt-2">
                        {v.fileCount} archivo(s)
                      </p>
                    )}
                    <code className="inline-block mt-3 bg-[#141414] px-3 py-2 rounded-none border border-[#C7C7C7] font-mono text-xs text-[#E3E2DE]">
                      unsarep install {pkg.name}@{v.version}
                    </code>
                  </div>
                  <Link
                    to="/registry/$name/$version"
                    params={{ name: pkg.name, version: v.version }}
                    className={buttonClasses('secondary', 'sm')}
                  >
                    Ver
                  </Link>
                </div>
              ))}
              <div
                className="border-b border-[#C7C7C7]"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      </section>

      <Outlet />

      {!hasChildMatch && latestVersionDetail && (
        <section className="grid grid-cols-12">
          <div className="col-span-12 md:col-span-3 p-6 md:border-r border-b md:border-b-0 border-[#C7C7C7]">
            <p className="grid-label md:sticky md:top-32">Latest</p>
          </div>
          <div className="col-span-12 md:col-span-9 p-6 md:p-12 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-none">
              Última versión (v{latestVersionDetail.version})
            </h2>
            <code className="block p-3 rounded-none bg-[#141414] text-[#E3E2DE] border border-[#C7C7C7] font-mono text-xs overflow-x-auto max-w-xl">
              unsarep install {pkg.name}@{latestVersionDetail.version}
            </code>
            {latestVersionDetail.archive_url && (
              <p>
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
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[#7A7A7A]">
              Archivos ({latestVersionDetail.files.length})
            </h3>
            {latestVersionDetail.files.length === 0 ? (
              <p className="text-sm text-[#7A7A7A] italic">Sin archivos</p>
            ) : (
              <ul className="space-y-1.5">
                {latestVersionDetail.files.map((f) => (
                  <li
                    key={f.path}
                    className="text-sm text-[#444343] border-t border-[#C7C7C7] py-2"
                  >
                    <code className="font-mono text-xs text-[#141414]">
                      {f.path}
                    </code>{' '}
                    <span className="text-xs text-[#7A7A7A]">
                      ({f.size} bytes)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
