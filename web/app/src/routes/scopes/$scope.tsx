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
      setErrorMessage('A valid email is required');
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <p>
        <Link to="/scopes" style={{ color: '#2563eb' }}>
          &larr; Back to Scopes Hub
        </Link>
      </p>

      <h1>Scope: {scope.name}</h1>
      <p style={{ color: '#4b5563' }}>
        {scope.description || 'No description provided.'}
      </p>

      <div
        style={{
          border: '1px solid #e5e7eb',
          padding: '1rem',
          borderRadius: '6px',
          backgroundColor: '#f9fafb',
          marginBottom: '1.5rem',
        }}
      >
        <p style={{ margin: '0 0 0.5rem' }}>
          <strong>Scope Type:</strong> {scope.scopeType} |{' '}
          <strong>Owner:</strong> <code>{scope.ownerId}</code>
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
          Created: {new Date(scope.createdAt).toLocaleString()} | Updated:{' '}
          {new Date(scope.updatedAt).toLocaleString()}
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          style={{
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            color: '#15803d',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          {successMessage}
        </div>
      )}

      <section style={{ marginBottom: '2rem' }}>
        <h2>Scope Archive & Configuration Files</h2>
        {scope.hasArchive ? (
          <div>
            <p>This scope has an active archive uploaded.</p>
            <button
              type="button"
              onClick={handleDownloadArchive}
              disabled={downloadingArchive}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              {downloadingArchive
                ? 'Requesting URL...'
                : 'Download Scope Archive (.zip)'}
            </button>
            <h3>Files in Scope ({scope.files.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  <th style={{ padding: '0.5rem' }}>Path</th>
                  <th style={{ padding: '0.5rem' }}>Size</th>
                  <th style={{ padding: '0.5rem' }}>SHA256 Checksum</th>
                </tr>
              </thead>
              <tbody>
                {scope.files.map((file) => (
                  <tr
                    key={file.path}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <td style={{ padding: '0.5rem' }}>{file.path}</td>
                    <td style={{ padding: '0.5rem' }}>{file.size} B</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                      <code>{file.checksum}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div>
            <p style={{ fontStyle: 'italic' }}>
              No archive has been pushed to this scope yet.
            </p>
            <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
              To push files to this scope, define a <code>[scope]</code> table
              in your <code>unsareport.toml</code> and run:
            </p>
            <pre
              style={{
                backgroundColor: '#f3f4f6',
                padding: '0.75rem',
                borderRadius: '4px',
              }}
            >
              unsarep registry scope push
            </pre>
          </div>
        )}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Team Members</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                textAlign: 'left',
                borderBottom: '2px solid #e5e7eb',
              }}
            >
              <th style={{ padding: '0.5rem' }}>User ID</th>
              <th style={{ padding: '0.5rem' }}>Role</th>
              <th style={{ padding: '0.5rem' }}>Joined At</th>
              <th style={{ padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {membersList.map((m) => {
              const isMemberOwner = m.userId === scope.ownerId;
              const isSelf = user?.id === m.userId;
              return (
                <tr
                  key={m.userId}
                  style={{ borderBottom: '1px solid #e5e7eb' }}
                >
                  <td style={{ padding: '0.5rem' }}>
                    <code>{m.userId}</code>
                    {isMemberOwner && ' (Owner)'}
                    {isSelf && ' (You)'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {isScopeAdmin && !isMemberOwner ? (
                      <select
                        value={m.role}
                        onChange={(e) =>
                          handleRoleChange(
                            m.userId,
                            e.target.value as ScopeMemberRole,
                          )
                        }
                        style={{ padding: '0.2rem' }}
                      >
                        <option value={ROLE_ADMIN}>admin</option>
                        <option value={ROLE_CONTRIBUTOR}>contributor</option>
                      </select>
                    ) : (
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor:
                            m.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                          color: m.role === 'admin' ? '#1d4ed8' : '#374151',
                          fontSize: '0.85rem',
                        }}
                      >
                        {m.role}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {isScopeAdmin && !isMemberOwner && !isSelf && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.userId)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #f87171',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        Remove
                      </button>
                    )}
                    {isSelf && !isMemberOwner && (
                      <button
                        type="button"
                        onClick={handleLeaveScope}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #f87171',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        Leave Scope
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {isScopeAdmin && (
        <section
          style={{
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            borderRadius: '6px',
            marginBottom: '2rem',
          }}
        >
          <h2>Invite Team Member</h2>
          <form
            onSubmit={handleInviteMember}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}
          >
            <input
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              style={{ padding: '0.4rem 0.6rem', width: '280px' }}
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as ScopeMemberRole)}
              style={{ padding: '0.4rem 0.6rem' }}
            >
              <option value={ROLE_CONTRIBUTOR}>
                Contributor (can publish)
              </option>
              <option value={ROLE_ADMIN}>Admin (can manage members)</option>
            </select>
            <button
              type="submit"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Send Invitation
            </button>
          </form>

          <h3>Pending Invitations for this Scope</h3>
          {invitationsList.length === 0 ? (
            <p style={{ fontStyle: 'italic' }}>
              No pending invitations sent for this scope.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '2px solid #e5e7eb',
                  }}
                >
                  <th style={{ padding: '0.5rem' }}>Email</th>
                  <th style={{ padding: '0.5rem' }}>Role</th>
                  <th style={{ padding: '0.5rem' }}>Sent At</th>
                  <th style={{ padding: '0.5rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invitationsList.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                  >
                    <td style={{ padding: '0.5rem' }}>{inv.email}</td>
                    <td style={{ padding: '0.5rem' }}>{inv.role}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {new Date(inv.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleCancelInvitation(inv.id)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #f87171',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        Cancel Invitation
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <section>
        <h2>Packages in this Scope</h2>
        {packages.length === 0 ? (
          <p style={{ fontStyle: 'italic' }}>
            No packages have been published under {scope.name} yet.
          </p>
        ) : (
          <ul>
            {packages.map((pkg) => (
              <li key={pkg.name}>
                <Link
                  to="/registry/$name"
                  params={{ name: pkg.name }}
                  style={{ color: '#2563eb', fontWeight: 'bold' }}
                >
                  {pkg.name}
                </Link>
                {pkg.displayName && ` — ${pkg.displayName}`}
                {pkg.latestVersion && ` (latest: v${pkg.latestVersion})`}
                {pkg.description && ` — ${pkg.description}`}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
