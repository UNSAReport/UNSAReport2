import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { Button } from '@/components/Button';
import { requireAuthServerFn } from '@/lib/auth/server';

export const Route = createFileRoute('/registry/upload')({
  beforeLoad: async () => {
    try {
      await requireAuthServerFn();
    } catch {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: UploadComponent,
});

function UploadComponent() {
  const fileInputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem('file') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) {
      setError('No se seleccionó ningún archivo');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/registry/v1/packages', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        let errMsg = `La publicación falló (${res.status})`;
        try {
          const json = (await res.json()) as {
            message?: string;
            error?: string;
          };
          if (json?.message) {
            errMsg = json.message;
          } else if (json?.error) {
            errMsg = json.error;
          }
        } catch {
          const text = await res.text();
          if (text) errMsg = text;
        }
        throw new Error(errMsg);
      }
      const data = (await res.json()) as {
        package: string;
        version: string;
        status: string;
      };
      setSuccess(
        `Paquete "${data.package}" v${data.version} publicado correctamente (Estado: ${data.status})`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 font-sans">
      <header className="border-b border-slate-700/60 pb-6">
        <Link
          to="/registry"
          search={{ search: undefined, tag: undefined }}
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          ← Volver a paquetes
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
          Publicar paquete
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Sube el archivo .zip o .tgz de tu plantilla Typst y publícalo como una
          nueva versión en el registro.
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-sm text-rose-300"
        >
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-sm text-emerald-300">
          {success}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        className="space-y-5"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={fileInputId}
            className="text-xs font-semibold uppercase tracking-wider text-slate-400"
          >
            Paquete (.zip, .tgz) <span aria-hidden="true">*</span>
          </label>
          <input
            id={fileInputId}
            type="file"
            name="file"
            accept=".zip,.tgz,.tar.gz"
            required
            className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          />
          <p className="text-xs text-slate-500">
            Archivo generado con el manifiesto unsareport.toml incluido
          </p>
        </div>
        <Button type="submit">Publicar paquete</Button>
      </form>
      <p className="text-sm text-slate-400 leading-relaxed">
        Requiere autenticación. Los paquetes deben tener scope (p. ej.{' '}
        <code className="font-mono text-xs text-indigo-300">
          @scope/package-name
        </code>
        ) y declarar un documento{' '}
        <code className="font-mono text-xs text-indigo-300">
          unsareport.toml
        </code>
        . Debes ser propietario o colaborador del scope destino.{' '}
        <Link
          to="/scopes"
          className="text-indigo-400 hover:text-indigo-300 underline"
        >
          Gestiona tus scopes e invitaciones aquí
        </Link>
        .
      </p>
    </div>
  );
}
