import { createFileRoute, notFound } from '@tanstack/react-router';
import { buttonClasses } from '@/components/Button';
import { Card } from '@/components/Card';
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
    <Card padding="md" className="mt-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#141414]">Versión {version}</h2>
        <div className="mt-3 bg-[#141414] px-3 py-2 rounded-none border border-[#C7C7C7] font-mono text-xs text-[#E3E2DE]">
          unsarep install {name}@{version}
        </div>
        {archive_url && (
          <p className="mt-3">
            <a
              href={archive_url}
              target="_blank"
              rel="noreferrer"
              className={buttonClasses('secondary', 'sm')}
            >
              Descargar archivo
            </a>
          </p>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#141414] mb-2">
          Manifiesto / dependencias
        </h3>
        <pre className="bg-[#141414] border border-[#C7C7C7] rounded-none p-4 text-xs font-mono text-[#E3E2DE] overflow-x-auto">
          {JSON.stringify(manifest, null, 2)}
        </pre>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[#141414] mb-2">
          Archivos ({files.length})
        </h3>
        {files.length === 0 ? (
          <p className="text-sm text-[#7A7A7A] italic">Sin archivos</p>
        ) : (
          <ul className="space-y-1.5">
            {files.map((f) => (
              <li key={f.path} className="text-sm text-[#444343]">
                <code className="font-mono text-xs text-[#141414]">
                  {f.path}
                </code>{' '}
                <span className="text-xs text-[#7A7A7A]">({f.size} bytes)</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
