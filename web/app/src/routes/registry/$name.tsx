import { createFileRoute, Link, notFound } from '@tanstack/react-router';
import {
  fetchPackageServerFn,
  fetchVersionsServerFn,
} from '@/lib/registry/client';

export const Route = createFileRoute('/registry/$name')({
  loader: async ({ params }) => {
    const name = params.name;
    try {
      const pkg = await fetchPackageServerFn({ data: { name } });
      const versions = await fetchVersionsServerFn({ data: { name } }).catch(
        () => [],
      );
      return { pkg, versions } as {
        pkg: {
          name: string;
          displayName?: string | null;
          description?: string | null;
          files?: string[];
        };
        versions: Array<{ version: string; files?: string[] }>;
      };
    } catch {
      throw notFound();
    }
  },
  component: PackageComponent,
});

function PackageComponent() {
  const { pkg, versions } = Route.useLoaderData();
  const isScoped = pkg.name.startsWith('@') && pkg.name.includes('/');
  const scopePart = isScoped ? pkg.name.split('/')[0] : null;

  return (
    <div>
      <h1>{pkg.name}</h1>
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
      <pre>{JSON.stringify(pkg, null, 2)}</pre>
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
              {v.files?.length ? ` — ${v.files.length} files` : ''}
            </li>
          ))}
        </ul>
      )}
      <h2>Files</h2>
      <ul>
        {(() => {
          const files = pkg.files;
          if (!files || files.length === 0) return <li>No files</li>;
          return files.map((f) => <li key={f}>{f}</li>);
        })()}
      </ul>
    </div>
  );
}
