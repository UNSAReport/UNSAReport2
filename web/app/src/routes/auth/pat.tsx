import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { TextInput } from '@/components/TextInput';
import {
  createPatServerFn,
  deletePatServerFn,
  listPatsServerFn,
  type PatItem,
} from '@/lib/auth/server';

export const Route = createFileRoute('/auth/pat')({
  loader: async () => {
    try {
      const pats = await listPatsServerFn();
      return { pats };
    } catch {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: PatComponent,
});

function PatComponent() {
  const router = useRouter();
  const loaderData = Route.useLoaderData();
  const [pats, setPats] = useState<PatItem[]>(loaderData.pats);
  const [name, setName] = useState('');
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPats(loaderData.pats);
  }, [loaderData.pats]);

  const handleCreate = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError(null);
    setNewToken(null);
    setCopied(false);
    try {
      const res = await createPatServerFn({ data: { name } });
      setNewToken(res.token);
      setName('');
      if (res.pat) {
        setPats((prev) => [
          res.pat,
          ...prev.filter((p) => p.id !== res.pat.id),
        ]);
      }
      await router.invalidate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deletePatServerFn({ data: { id } });
      setPats((prev) => prev.filter((p) => p.id !== id));
      await router.invalidate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 font-sans bg-[#E3E2DE] text-[#141414]">
      <header className="border-b border-[#C7C7C7] pb-6">
        <p className="grid-label">UNSAReport · Cuenta</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#141414] mt-1">
          Tokens de acceso personal
        </h1>
        <p className="text-sm text-[#444343] mt-1">
          Crea y revoca tokens para el CLI y otras integraciones. El token solo
          se muestra una vez.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-transparent border border-[#C7C7C7] px-4 py-3 rounded-none"
        >
          {error}
        </div>
      )}

      {newToken && (
        <div className="rounded-none border border-[#C7C7C7] bg-transparent p-4">
          <p className="font-bold text-green-700">Token creado correctamente</p>
          <p className="mt-1 text-sm text-emerald-200/80">
            Cópialo ahora — no volverá a mostrarse:
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <code className="flex-1 min-w-0 bg-[#141414] border border-[#C7C7C7] px-3 py-2 rounded-none break-all font-mono text-xs text-[#E3E2DE]">
              {newToken}
            </code>
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(newToken);
                setCopied(true);
              }}
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </Button>
          </div>
        </div>
      )}

      <Card>
        <form
          onSubmit={handleCreate}
          className="flex flex-col sm:flex-row gap-3 sm:items-end"
        >
          <div className="flex-1">
            <TextInput
              label="Nombre del token"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="p. ej. mi-portátil"
              required
            />
          </div>
          <Button type="submit">Crear token</Button>
        </form>
      </Card>

      <Card padding="none">
        {pats.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin tokens"
              body="Aún no tienes tokens de acceso personal. Crea el primero con el formulario de arriba."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[#C7C7C7]">
                  <th className="px-4 py-3 grid-label">ID</th>
                  <th className="px-4 py-3 grid-label">Nombre</th>
                  <th className="px-4 py-3 grid-label text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pats.map((pat) => (
                  <tr
                    key={pat.id}
                    className="border-b border-[#C7C7C7] last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[#444343] break-all">
                      {pat.id}
                    </td>
                    <td className="px-4 py-3 text-[#141414] font-medium">
                      {pat.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pat.id)}
                        className="text-rose-400 hover:text-red-700"
                      >
                        Revocar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
