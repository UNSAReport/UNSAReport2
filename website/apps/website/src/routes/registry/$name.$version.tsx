import { createFileRoute, notFound } from '@tanstack/react-router';
import { fetchVersionServerFn } from '@/lib/registry/client';

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
  type VersionData = {
    archive_url?: string;
    archiveUrl?: string;
    files?: string[];
    manifest?: Record<string, string | string[]>;
  };
  const v = data as VersionData;
  const archiveUrl = v.archive_url ?? v.archiveUrl;
  const files = v.files ?? [];
  // manifest may be nested or top-level
  const manifest = v.manifest ?? v;

  return (
    <div>
      <h1>
        {name}@{version}
      </h1>
      <p>
        Install:{' '}
        <code>
          unsarep install {name}@{version}
        </code>
      </p>
      {archiveUrl && (
        <p>
          <a href={archiveUrl}>Download archive</a>
        </p>
      )}
      <h2>Manifest</h2>
      <pre>{JSON.stringify(manifest, null, 2)}</pre>
      <h2>Files</h2>
      {files.length === 0 ? (
        <p>No files</p>
      ) : (
        <ul>
          {files.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
