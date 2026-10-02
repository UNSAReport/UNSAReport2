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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 font-sans bg-[#E3E2DE] text-[#141414]">
      <header className="border-b border-[#C7C7C7] pb-6">
        <Link
          to="/registry"
          search={{ search: undefined, tag: undefined }}
          className="text-xs font-semibold text-[#444343] hover:text-[#141414] transition-colors duration-300"
        >
          ← Volver a paquetes
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#141414] mt-2">
          Publicar paquete
        </h1>
        <p className="text-sm text-[#444343] mt-1">
          Sube el archivo .zip o .tgz de tu plantilla Typst y publícalo como una
          nueva versión en el registro.
        </p>
      </header>
      {error && (
        <div
          role="alert"
          className="p-4 rounded-none border border-[#C7C7C7] bg-transparent text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-none border border-[#C7C7C7] bg-transparent text-sm text-green-700">
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
            className="grid-label"
          >
            Paquete (.zip, .tgz) <span aria-hidden="true">*</span>
          </label>
          <input
            id={fileInputId}
            type="file"
            name="file"
            accept=".zip,.tgz,.tar.gz"
            required
            className="w-full px-3.5 py-2 rounded-none bg-transparent border border-[#C7C7C7] text-sm text-[#141414] file:mr-3 file:px-3 file:py-1.5 file:rounded-none file:border-0 file:bg-[#141414] file:text-[#E3E2DE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]/50"
          />
          <p className="text-xs text-[#7A7A7A]">
            Archivo generado con el manifiesto unsareport.toml incluido
          </p>
        </div>
        <Button type="submit">Publicar paquete</Button>
      </form>
      <p className="text-sm text-[#444343] leading-relaxed">
        Requiere autenticación. Los paquetes deben tener scope (p. ej.{' '}
        <code className="font-mono text-xs text-[#1351AA]">
          @scope/package-name
        </code>
        ) y declarar un documento{' '}
        <code className="font-mono text-xs text-[#1351AA]">
          unsareport.toml
        </code>
        . Debes ser propietario o colaborador del scope destino.{' '}
        <Link
          to="/scopes"
          className="text-[#1351AA] hover:text-[#1351AA] underline transition-colors duration-300"
        >
          Gestiona tus scopes e invitaciones aquí
        </Link>
        .
      </p>
    </div>
  );
}
