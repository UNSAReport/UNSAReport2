import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router';
import type { ScopeInvitationItem, ScopeItem } from '@unsa/schemas/registry';
import { useState } from 'react';
import { Button, buttonClasses } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { TextInput } from '@/components/TextInput';
import { requireAuthServerFn } from '@/lib/auth/server';
import {
  acceptScopeInvitationServerFn,
  declineScopeInvitationServerFn,
  fetchUserScopesServerFn,
  listUserInvitationsServerFn,
  MIN_SCOPE_REASON_LENGTH,
  requestCustomScopeServerFn,
} from '@/lib/registry/scopes';

export const Route = createFileRoute('/scopes/')({
  beforeLoad: async () => {
    try {
      await requireAuthServerFn();
    } catch {
      throw redirect({ to: '/auth/login' });
    }
  },
  loader: async () => {
    const [scopes, invitations] = await Promise.all([
      fetchUserScopesServerFn().catch(() => []),
      listUserInvitationsServerFn().catch(() => []),
    ]);
    return { scopes, invitations };
  },
  component: ScopesIndexComponent,
});

function ScopesIndexComponent() {
  const router = useRouter();
  const loaderData = Route.useLoaderData();

  const [scopesList, setScopesList] = useState<ScopeItem[]>(loaderData.scopes);
  const [invitationsList, setInvitationsList] = useState<ScopeInvitationItem[]>(
    loaderData.invitations,
  );

  const [scopeNameInput, setScopeNameInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleRequestScope = async (e: React.SubmitEvent) => {
    e.preventDefault();
    clearMessages();

    const name = scopeNameInput.trim();
    const reason = reasonInput.trim();

    if (!name.startsWith('@')) {
      setErrorMessage(
        'El nombre del scope debe empezar con "@" (p. ej. "@miorg")',
      );
      return;
    }
    if (reason.length < MIN_SCOPE_REASON_LENGTH) {
      setErrorMessage(
        `El motivo debe tener al menos ${MIN_SCOPE_REASON_LENGTH} caracteres`,
      );
      return;
    }

    try {
      const res = await requestCustomScopeServerFn({
        data: { scopeName: name, reason },
      });
      setSuccessMessage(res.message);
      setScopeNameInput('');
      setReasonInput('');
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    clearMessages();
    try {
      const res = await acceptScopeInvitationServerFn({
        data: { invitationId },
      });
      setInvitationsList((prev) => prev.filter((i) => i.id !== invitationId));
      setSuccessMessage(res.message);
      const updatedScopes = await fetchUserScopesServerFn();
      setScopesList(updatedScopes);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    clearMessages();
    try {
      const res = await declineScopeInvitationServerFn({
        data: { invitationId },
      });
      setInvitationsList((prev) => prev.filter((i) => i.id !== invitationId));
      setSuccessMessage(res.message);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 font-sans">
      <header className="border-b border-slate-700/60 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          UNSAReport · Registro
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
          Centro de scopes
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gestiona tus scopes personales y de organización, responde
          invitaciones de equipo y solicita scopes personalizados.
        </p>
      </header>

      {errorMessage && (
        <div
          role="alert"
          className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 px-4 py-3 rounded-xl"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 rounded-xl"
        >
          {successMessage}
        </div>
      )}

      <Card padding="none">
        <h2 className="text-lg font-bold text-slate-100 px-6 pt-5">
          Mis scopes
        </h2>
        {scopesList.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin scopes"
              body="Aún no perteneces a ningún scope. Solicita uno personalizado más abajo."
            />
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-800">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Scope
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tu rol
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {scopesList.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-800/60 last:border-0"
                  >
                    <td className="px-4 py-3 font-bold">
                      <Link
                        to="/scopes/$scope"
                        params={{ scope: s.name }}
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        {s.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{s.scopeType}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border uppercase tracking-wider ${
                          s.role === 'admin'
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {s.role ?? 'member'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {s.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/scopes/$scope"
                        params={{ scope: s.name }}
                        className={buttonClasses('secondary', 'sm')}
                      >
                        Gestionar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card padding="none">
        <h2 className="text-lg font-bold text-slate-100 px-6 pt-5">
          Invitaciones pendientes
        </h2>
        {invitationsList.length === 0 ? (
          <p className="px-6 pb-6 pt-2 text-sm italic text-slate-500">
            No tienes invitaciones pendientes.
          </p>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-800">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Scope
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Rol ofrecido
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Invitado el
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {invitationsList.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-slate-800/60 last:border-0"
                  >
                    <td className="px-4 py-3 font-bold text-slate-100">
                      {inv.scopeName ?? inv.scopeId}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{inv.role}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(inv.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(inv.id)}
                        >
                          Aceptar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeclineInvitation(inv.id)}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          Rechazar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-slate-100">
          Solicitar un scope personalizado
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Los scopes personalizados (como{' '}
          <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">
            @organizacion
          </code>
          ) permiten que varios miembros publiquen paquetes juntos bajo un
          espacio de nombres compartido.
        </p>

        <form
          onSubmit={handleRequestScope}
          className="flex flex-col gap-4 max-w-lg mt-4"
        >
          <TextInput
            label="Nombre del scope"
            name="scopeName"
            value={scopeNameInput}
            onChange={(e) => setScopeNameInput(e.target.value)}
            placeholder="@miorg"
            required
          />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="scope-reason"
              className="text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Motivo / justificación *
            </label>
            <textarea
              id="scope-reason"
              rows={3}
              placeholder="Explica por qué tu proyecto u organización necesita este scope…"
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
            />
          </div>
          <div>
            <Button type="submit">Enviar solicitud</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
