import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
  useChildMatches,
} from '@tanstack/react-router';
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
    <div>
      <h1>{pkg.name}</h1>
      {pkg.displayName && (
        <p style={{ fontSize: '1.2rem', color: '#4b5563' }}>
          {pkg.displayName}
        </p>
      )}
      {pkg.description && <p>{pkg.description}</p>}
      {scopePart && (
        <p>
          Belongs to Scope:{' '}
          <Link
            to="/scopes/$scope"
            params={{ scope: scopePart }}
            style={{ fontWeight: 'bold', color: '#2563eb' }}
          >
            {scopePart}
          </Link>
        </p>
      )}
      {pkg.tags && pkg.tags.length > 0 && (
        <p>
          Tags:{' '}
          {pkg.tags.map((t) => (
            <span
              key={t}
              style={{
                marginRight: '0.5rem',
                background: '#e5e7eb',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              {t}
            </span>
          ))}
        </p>
      )}

      <h2>Versions</h2>
      {versions.length === 0 ? (
        <p>No versions</p>
      ) : (
        <ul>
          {versions.map((v) => (
            <li key={v.version}>
              <Link
                to="/registry/$name/$version"
                params={{ name: pkg.name, version: v.version }}
              >
                {v.version}
              </Link>
              {v.fileCount !== undefined ? ` — ${v.fileCount} file(s)` : ''}
              {v.version === pkg.latestVersion ? ' (latest)' : ''}
            </li>
          ))}
        </ul>
      )}

      <Outlet />

      {!hasChildMatch && (
        <div>
          {latestVersionDetail ? (
            <div>
              <h2>Latest Version ({latestVersionDetail.version})</h2>
              <p>
                Install:{' '}
                <code>
                  unsarep install {pkg.name}@{latestVersionDetail.version}
                </code>
              </p>
              {latestVersionDetail.archive_url && (
                <p>
                  <a
                    href={latestVersionDetail.archive_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download archive
                  </a>
                </p>
              )}
              <h3>Files ({latestVersionDetail.files.length})</h3>
              {latestVersionDetail.files.length === 0 ? (
                <p>No files</p>
              ) : (
                <ul>
                  {latestVersionDetail.files.map((f) => (
                    <li key={f.path}>
                      <code>{f.path}</code> ({f.size} bytes)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div>
              <h2>Files</h2>
              <p>No files</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
