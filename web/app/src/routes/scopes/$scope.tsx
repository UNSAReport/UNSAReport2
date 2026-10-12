import {
  createFileRoute,
  Link,
  notFound,
  useRouter,
} from '@tanstack/react-router';
import type {
  ScopeDetail,
  ScopeInvitationItem,
  ScopeMemberRole,
} from '@unsa/schemas/registry';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TextInput } from '@/components/TextInput';
import { fetchCurrentUser } from '@/lib/auth/server';
import { fetchPackagesServerFn } from '@/lib/registry/client';
import {
  cancelScopeInvitationServerFn,
  fetchScopeArchiveDownloadUrlServerFn,
  fetchScopeDetailServerFn,
  inviteScopeMemberServerFn,
  listScopeInvitationsServerFn,
  ROLE_ADMIN,
  ROLE_CONTRIBUTOR,
  removeScopeMemberServerFn,
  updateScopeMemberRoleServerFn,
} from '@/lib/registry/scopes';

export const Route = createFileRoute('/scopes/$scope')({
  loader: async ({ params }) => {
    const scopeName = decodeURIComponent(params.scope);
    const user = await fetchCurrentUser();

    let scopeDetail: ScopeDetail;
    try {
      scopeDetail = await fetchScopeDetailServerFn({
        data: { scope: scopeName },
      });
    } catch {
      throw notFound();
    }

    const isOwner = user?.id === scopeDetail.ownerId;
    const isRegistryAdmin = user?.roles?.registry === 'admin';
    const isMemberAdmin = scopeDetail.members.some(
      (m) => m.userId === user?.id && m.role === 'admin',
    );
    const isScopeAdmin = isOwner || isRegistryAdmin || isMemberAdmin;

    const [invitations, packages] = await Promise.all([
      isScopeAdmin
        ? listScopeInvitationsServerFn({ data: { scope: scopeName } }).catch(
            () => [],
          )
        : Promise.resolve([]),
      fetchPackagesServerFn({ data: { search: scopeName } }).catch(() => []),
    ]);

    const scopePackages = packages.filter((p) =>
      p.name.startsWith(`${scopeName}/`),
    );

    return {
      user,
      scope: scopeDetail,
      isScopeAdmin,
      invitations,
      packages: scopePackages,
    };
  },
  component: ScopeDetailComponent,
});

function ScopeDetailComponent() {
  const router = useRouter();
  const { user, scope, isScopeAdmin, invitations, packages } =
    Route.useLoaderData();

  const [membersList, setMembersList] = useState(scope.members);
  const [invitationsList, setInvitationsList] =
    useState<ScopeInvitationItem[]>(invitations);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] =
    useState<ScopeMemberRole>(ROLE_CONTRIBUTOR);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [downloadingArchive, setDownloadingArchive] = useState(false);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleDownloadArchive = async () => {
    clearMessages();
    setDownloadingArchive(true);
    try {
      const res = await fetchScopeArchiveDownloadUrlServerFn({
        data: { scope: scope.name },
      });
      window.open(res.downloadUrl, '_blank');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setDownloadingArchive(false);
    }
  };

  const handleInviteMember = async (e: React.SubmitEvent) => {
    e.preventDefault();
    clearMessages();
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      setErrorMessage('Se requiere un correo válido');
      return;
    }

    try {
      const res = await inviteScopeMemberServerFn({
        data: { scope: scope.name, email, role: inviteRole },
      });
      setSuccessMessage(res.message);
      setInviteEmail('');
      setInvitationsList((prev) => [
        {
          id: res.invitation.id,
          scopeId: scope.id,
          scopeName: scope.name,
          email: res.invitation.email,
          role: res.invitation.role as ScopeMemberRole,
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    clearMessages();
    try {
      const res = await cancelScopeInvitationServerFn({
        data: { scope: scope.name, invitationId },
      });
      setInvitationsList((prev) => prev.filter((i) => i.id !== invitationId));
      setSuccessMessage(res.message);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRoleChange = async (userId: string, newRole: ScopeMemberRole) => {
    clearMessages();
    try {
      const res = await updateScopeMemberRoleServerFn({
        data: { scope: scope.name, userId, role: newRole },
      });
      setMembersList((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: res.role } : m)),
      );
      setSuccessMessage(res.message);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    clearMessages();
    try {
      const res = await removeScopeMemberServerFn({
        data: { scope: scope.name, userId },
      });
      setMembersList((prev) => prev.filter((m) => m.userId !== userId));
      setSuccessMessage(res.message);
      await router.invalidate();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleLeaveScope = async () => {
    if (!user) return;
    clearMessages();
    try {
      const res = await removeScopeMemberServerFn({
        data: { scope: scope.name, userId: user.id },
      });
      setSuccessMessage(res.message);
      window.location.href = '/scopes';
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 font-sans bg-[#E3E2DE] text-[#141414]">
      <header className="border-b border-[#C7C7C7] pb-6">
        <Link
          to="/scopes"
          className="text-xs font-semibold text-[#444343] hover:text-[#141414] transition-colors duration-300"
        >
          ← Volver al centro de scopes
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#141414] mt-2">
          Scope: {scope.name}
        </h1>
        <p className="text-sm text-[#444343] mt-1">
          {scope.description || 'Sin descripción.'}
        </p>
      </header>

      <Card>
        <p className="text-sm text-[#444343]">
          <strong className="text-[#141414]">Tipo:</strong> {scope.scopeType} ·{' '}
          <strong className="text-[#141414]">Propietario:</strong>{' '}
          <code className="bg-[#141414] px-1.5 py-0.5 rounded-none text-[#E3E2DE] text-xs">
            {scope.ownerId}
          </code>
        </p>
        <p className="text-xs text-[#7A7A7A] mt-1">
          Creado: {new Date(scope.createdAt).toLocaleString()} · Actualizado:{' '}
          {new Date(scope.updatedAt).toLocaleString()}
        </p>
      </Card>

      {errorMessage && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-transparent border border-[#C7C7C7] px-4 py-3 rounded-none"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="text-sm text-green-700 bg-transparent border border-[#C7C7C7] px-4 py-3 rounded-none"
        >
          {successMessage}
        </div>
      )}

      <Card>
        <h2 className="text-lg font-bold text-[#141414]">
          Archivo y configuración del scope
        </h2>
        {scope.hasArchive ? (
          <div className="mt-2">
            <p className="text-sm text-[#444343]">
              Este scope tiene un archivo activo.
            </p>
            <div className="mt-3">
              <Button
                onClick={handleDownloadArchive}
                disabled={downloadingArchive}
              >
                {downloadingArchive
                  ? 'Solicitando URL…'
                  : 'Descargar archivo del scope (.zip)'}
              </Button>
            </div>
            <h3 className="text-sm font-bold text-[#141414] mt-4">
              Archivos ({scope.files.length})
            </h3>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#C7C7C7]">
                    <th className="px-3 py-2 grid-label">Ruta</th>
                    <th className="px-3 py-2 grid-label">Tamaño</th>
                    <th className="px-3 py-2 grid-label">SHA256</th>
                  </tr>
                </thead>
                <tbody>
                  {scope.files.map((file) => (
                    <tr
                      key={file.path}
                      className="border-b border-[#C7C7C7] last:border-0"
                    >
                      <td className="px-3 py-2 text-[#141414]">{file.path}</td>
                      <td className="px-3 py-2 text-[#444343]">
                        {file.size} B
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <code className="text-[#444343] break-all">
                          {file.checksum}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-sm italic text-[#7A7A7A]">
              Aún no se ha subido ningún archivo a este scope.
            </p>
            <p className="text-sm text-[#444343] mt-2">
              Para subir archivos, define una tabla{' '}
              <code className="bg-[#141414] px-1.5 py-0.5 rounded-none text-[#E3E2DE]">
                [scope]
              </code>{' '}
              en tu{' '}
              <code className="bg-[#141414] px-1.5 py-0.5 rounded-none text-[#E3E2DE]">
                unsareport.toml
              </code>{' '}
              y ejecuta:
            </p>
            <pre className="bg-[#141414] border border-[#C7C7C7] px-3 py-2 rounded-none mt-2 text-xs text-[#E3E2DE] overflow-x-auto">
              unsarep registry scope push
            </pre>
          </div>
        )}
      </Card>

      <Card padding="none">
        <h2 className="text-lg font-bold text-[#141414] px-6 pt-5">
          Miembros del equipo
        </h2>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#C7C7C7]">
                <th className="px-4 py-3 grid-label">ID de usuario</th>
                <th className="px-4 py-3 grid-label">Rol</th>
                <th className="px-4 py-3 grid-label">Desde</th>
                <th className="px-4 py-3 grid-label text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {membersList.map((m) => {
                const isMemberOwner = m.userId === scope.ownerId;
                const isSelf = user?.id === m.userId;
                return (
                  <tr
                    key={m.userId}
                    className="border-b border-[#C7C7C7] last:border-0"
                  >
                    <td className="px-4 py-3 text-[#141414]">
                      <code className="text-xs text-[#444343]">{m.userId}</code>
                      {isMemberOwner && (
                        <span className="text-xs text-[#7A7A7A]">
                          {' '}
                          (Propietario)
                        </span>
                      )}
                      {isSelf && (
                        <span className="text-xs text-[#7A7A7A]"> (Tú)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isScopeAdmin && !isMemberOwner ? (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(
                              m.userId,
                              e.target.value as ScopeMemberRole,
                            )
                          }
                          className="px-2 py-1 rounded-none bg-transparent border border-[#C7C7C7] text-sm text-[#141414] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]/50"
                        >
                          <option value={ROLE_ADMIN}>admin</option>
                          <option value={ROLE_CONTRIBUTOR}>contributor</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-none text-[11px] font-semibold border uppercase tracking-wider ${
                            m.role === 'admin'
                              ? 'bg-[#141414] text-[#E3E2DE] border-[#C7C7C7]'
                              : 'bg-transparent text-[#444343] border-[#C7C7C7]'
                          }`}
                        >
                          {m.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#444343] text-xs">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isScopeAdmin && !isMemberOwner && !isSelf && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(m.userId)}
                          className="text-rose-400 hover:text-red-700"
                        >
                          Eliminar
                        </Button>
                      )}
                      {isSelf && !isMemberOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLeaveScope}
                          className="text-rose-400 hover:text-red-700"
                        >
                          Salir del scope
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {isScopeAdmin && (
        <Card>
          <h2 className="text-lg font-bold text-[#141414]">
            Invitar miembro del equipo
          </h2>
          <form
            onSubmit={handleInviteMember}
            className="flex gap-2 items-end flex-wrap mt-4"
          >
            <div className="flex-1 min-w-52">
              <TextInput
                label="Correo electrónico"
                name="inviteEmail"
                type="email"
                placeholder="colega@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="invite-role" className="grid-label">
                Rol
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as ScopeMemberRole)
                }
                className="px-3.5 py-2 rounded-none bg-transparent border border-[#C7C7C7] text-sm text-[#141414] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]/50"
              >
                <option value={ROLE_CONTRIBUTOR}>
                  Colaborador (puede publicar)
                </option>
                <option value={ROLE_ADMIN}>Admin (gestiona miembros)</option>
              </select>
            </div>
            <Button type="submit">Enviar invitación</Button>
          </form>

          <h3 className="text-sm font-bold text-[#141414] mt-6">
            Invitaciones pendientes de este scope
          </h3>
          {invitationsList.length === 0 ? (
            <p className="text-sm italic text-[#7A7A7A] mt-1">
              No hay invitaciones pendientes para este scope.
            </p>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[#C7C7C7]">
                    <th className="px-3 py-2 grid-label">Correo</th>
                    <th className="px-3 py-2 grid-label">Rol</th>
                    <th className="px-3 py-2 grid-label">Enviada el</th>
                    <th className="px-3 py-2 grid-label text-right">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {invitationsList.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-[#C7C7C7] last:border-0"
                    >
                      <td className="px-3 py-2 text-[#141414]">{inv.email}</td>
                      <td className="px-3 py-2 text-[#444343]">{inv.role}</td>
                      <td className="px-3 py-2 text-[#444343] text-xs">
                        {new Date(inv.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(inv.id)}
                          className="text-rose-400 hover:text-red-700"
                        >
                          Cancelar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-bold text-[#141414]">
          Paquetes de este scope
        </h2>
        {packages.length === 0 ? (
          <p className="text-sm italic text-[#7A7A7A] mt-1">
            Aún no se ha publicado ningún paquete bajo {scope.name}.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {packages.map((pkg) => (
              <li key={pkg.name} className="text-sm text-[#444343]">
                <Link
                  to="/registry/$name"
                  params={{ name: pkg.name }}
                  className="text-[#1351AA] hover:text-[#1351AA] transition-colors duration-300 font-bold"
                >
                  {pkg.name}
                </Link>
                {pkg.displayName && (
                  <span className="text-[#444343]"> — {pkg.displayName}</span>
                )}
                {pkg.latestVersion && (
                  <span className="text-[#7A7A7A]">
                    {' '}
                    (última: v{pkg.latestVersion})
                  </span>
                )}
                {pkg.description && (
                  <span className="text-[#444343]"> — {pkg.description}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
