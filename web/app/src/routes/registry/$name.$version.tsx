import { createFileRoute, notFound } from '@tanstack/react-router';
import {
  fetchVersionServerFn,
  type RegistryVersionDetail,
} from '@/lib/registry/client';

export const Route = createFileRoute('/registry/$name/$version')({
  loader: async ({ params }) => {
    try {
      const data = await fetchVersionServerFn({
        data: { name: params.name, version: params.version },
      });
      return { data, name: params.name, version: params.version };
    } catch {
      throw notFound();
    }
  },
  component: VersionComponent,
});

function VersionComponent() {
  const { data, name, version } = Route.useLoaderData();
  const v = data as RegistryVersionDetail;
  const archive_url = v.archive_url;
  const files = v.files ?? [];
  const manifest = v.dependencies ?? v;

  return (
    <div
      style={{
        marginTop: '1.5rem',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '1rem',
      }}
    >
      <h2>Version {version}</h2>
      <p>
        Install:{' '}
        <code>
          unsarep install {name}@{version}
        </code>
      </p>
      {archive_url && (
        <p>
          <a href={archive_url} target="_blank" rel="noreferrer">
            Download archive
          </a>
        </p>
      )}
      <h3>Manifest / Dependencies</h3>
      <pre>{JSON.stringify(manifest, null, 2)}</pre>
      <h3>Files ({files.length})</h3>
      {files.length === 0 ? (
        <p>No files</p>
      ) : (
        <ul>
          {files.map((f) => (
            <li key={f.path}>
              <code>{f.path}</code> ({f.size} bytes)
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
