import { createFileRoute } from '@tanstack/react-router';
import { fetchVersionManifestServerFn } from '@/lib/version';

export const Route = createFileRoute('/releases')({
  loader: async () => {
    const manifest = await fetchVersionManifestServerFn();
    return { manifest };
  },
  component: ReleasesComponent,
});

const PLATFORMS = [
  {
    key: 'linux-amd64',
    name: 'Linux (x86_64)',
    binary: 'unsarep-linux-amd64',
    desc: 'Ubuntu, Debian, Fedora, Arch y derivados de 64 bits',
  },
  {
    key: 'linux-arm64',
    name: 'Linux (ARM64)',
    binary: 'unsarep-linux-arm64',
    desc: 'Raspberry Pi, servidores AWS Graviton y sistemas ARM64',
  },
  {
    key: 'darwin-arm64',
    name: 'macOS (Apple Silicon)',
    binary: 'unsarep-darwin-arm64',
    desc: 'Macs con procesadores M1, M2, M3, M4',
  },
  {
    key: 'darwin-amd64',
    name: 'macOS (Intel)',
    binary: 'unsarep-darwin-amd64',
    desc: 'Macs anteriores con procesadores Intel de 64 bits',
  },
  {
    key: 'windows-amd64',
    name: 'Windows (x64)',
    binary: 'unsarep-windows-amd64.exe',
    desc: 'Windows 10/11 estándar de 64 bits',
  },
  {
    key: 'windows-arm64',
    name: 'Windows (ARM64)',
    binary: 'unsarep-windows-arm64.exe',
    desc: 'Dispositivos Windows on ARM',
  },
];

function ReleasesComponent() {
  const { manifest } = Route.useLoaderData();
  const stable = manifest.stable;
  const dev = manifest.dev;

  return (
    <div className="min-h-screen bg-[#E3E2DE] text-[#141414] font-sans">
      <section className="grid grid-cols-12 border-b border-[#C7C7C7]">
        <div className="col-span-12 md:col-span-3 md:border-r border-b md:border-b-0 border-[#C7C7C7] p-6 flex md:flex-col flex-row items-center md:items-start gap-4">
          <span aria-hidden="true" className="block w-4 h-4 bg-[#141414]" />
          <p className="grid-label">Descargas & Releases</p>
          <p className="md:mt-auto font-mono text-[11px] text-[#7A7A7A]">
            Canal Estable: {stable.version}
            <br />
            Canal Dev: {dev.version}
          </p>
        </div>
        <div className="col-span-12 md:col-span-9 p-6 md:p-12 flex flex-col justify-center gap-8">
          <h1 className="poster-headline uppercase text-5xl md:text-7xl xl:text-8xl">
            unsarep <span className="text-[#1351AA]">CLI</span>
          </h1>
          <p className="max-w-162.5 text-lg text-[#444343] leading-relaxed">
            Binarios compilados y verificados criptográficamente para Linux,
            macOS y Windows. Actualiza en sitio con auto-update integrado en
            canales estable y desarrollo.
          </p>

          <div className="bg-[#141414] text-[#E3E2DE] p-6 font-mono text-sm max-w-2xl border-l-4 border-[#1351AA]">
            <p className="text-xs text-[#7A7A7A] uppercase tracking-wider mb-2 font-sans font-bold">
              Instalación rápida o auto-actualización
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <code>unsarep upgrade</code>
                <span className="text-xs text-[#7A7A7A]">
                  Canal estable ({stable.version})
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <code>unsarep upgrade --channel dev</code>
                <span className="text-xs text-[#7A7A7A]">Canal desarrollo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-12 border-b border-[#C7C7C7]">
        <div className="col-span-12 lg:col-span-6 p-6 md:p-8 lg:border-r border-b lg:border-b-0 border-[#C7C7C7]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold tracking-widest uppercase bg-[#1351AA] text-white px-3 py-1">
              Canal Estable
            </span>
            <span className="font-mono text-xs text-[#7A7A7A]">
              {stable.version}
            </span>
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">
            Versión Oficial
          </h2>
          <p className="text-sm text-[#444343] mb-6">
            Compilación recomendada para entornos de producción y redacción
            formal de informes.
          </p>

          <div className="space-y-3 mb-6">
            {PLATFORMS.map((p) => {
              const url =
                stable.downloadUrls?.[p.key] || stable.downloadUrls?.[p.binary];
              return (
                <div
                  key={p.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#D9D8D3] border border-[#C7C7C7] gap-2"
                >
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-[#7A7A7A]">{p.desc}</p>
                  </div>
                  {url ? (
                    <a
                      href={url}
                      className="inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-[#141414] text-white px-4 py-2 hover:bg-[#1351AA] transition-colors"
                      download
                    >
                      Descargar
                    </a>
                  ) : (
                    <span className="text-xs text-[#7A7A7A] italic">
                      No disponible
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#7A7A7A]">
            {stable.checksumsUrl && (
              <a
                href={stable.checksumsUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#1351AA]"
              >
                checksums.txt (SHA256)
              </a>
            )}
            {stable.releaseUrl && (
              <a
                href={stable.releaseUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#1351AA]"
              >
                Notas de la versión en GitHub
              </a>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 p-6 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold tracking-widest uppercase bg-[#df8e1d] text-[#141414] px-3 py-1 font-mono">
              Canal Desarrollo (Prerelease)
            </span>
            <span className="font-mono text-xs text-[#7A7A7A]">
              {dev.version}
            </span>
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">
            Build de Desarrollo
          </h2>
          <p className="text-sm text-[#444343] mb-6">
            Compilado automáticamente de la rama{' '}
            <code className="font-mono font-bold">dev</code> con las últimas
            funcionalidades.
            {dev.commit && dev.commit !== 'unknown' && (
              <span className="block mt-1 font-mono text-xs text-[#7A7A7A]">
                Commit: {dev.commit}
              </span>
            )}
          </p>

          <div className="space-y-3 mb-6">
            {PLATFORMS.map((p) => {
              const url =
                dev.downloadUrls?.[p.key] || dev.downloadUrls?.[p.binary];
              return (
                <div
                  key={p.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#D9D8D3] border border-[#C7C7C7] gap-2"
                >
                  <div>
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="text-xs text-[#7A7A7A]">{p.desc}</p>
                  </div>
                  {url ? (
                    <a
                      href={url}
                      className="inline-flex items-center justify-center text-xs font-bold uppercase tracking-wider bg-[#141414] text-white px-4 py-2 hover:bg-[#df8e1d] hover:text-[#141414] transition-colors"
                      download
                    >
                      Descargar dev
                    </a>
                  ) : (
                    <span className="text-xs text-[#7A7A7A] italic">
                      No disponible
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#7A7A7A]">
            {dev.checksumsUrl && (
              <a
                href={dev.checksumsUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#1351AA]"
              >
                checksums.txt (SHA256)
              </a>
            )}
            {dev.releaseUrl && (
              <a
                href={dev.releaseUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-[#1351AA]"
              >
                Prerelease en GitHub
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
