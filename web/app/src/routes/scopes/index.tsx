import {
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from '@tanstack/react-router';
import type { ScopeInvitationItem, ScopeItem } from '@unsa/schemas/registry';
import { useState } from 'react';
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
      setErrorMessage('Scope name must start with "@" (e.g. "@myorg")');
      return;
    }
    if (reason.length < MIN_SCOPE_REASON_LENGTH) {
      setErrorMessage(
        `Reason must be at least ${MIN_SCOPE_REASON_LENGTH} characters long`,
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <h1>Scopes Hub</h1>
      <p>
        Manage your personal and organizational scopes, respond to team
        invitations, and request custom scopes.
      </p>

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
        <h2>My Scopes</h2>
        {scopesList.length === 0 ? (
          <p>No scopes found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  textAlign: 'left',
                  borderBottom: '2px solid #e5e7eb',
                }}
              >
                <th style={{ padding: '0.5rem' }}>Scope Name</th>
                <th style={{ padding: '0.5rem' }}>Type</th>
                <th style={{ padding: '0.5rem' }}>Your Role</th>
                <th style={{ padding: '0.5rem' }}>Description</th>
                <th style={{ padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scopesList.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                    <Link
                      to="/scopes/$scope"
                      params={{ scope: s.name }}
                      style={{ color: '#2563eb' }}
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td style={{ padding: '0.5rem' }}>{s.scopeType}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor:
                          s.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                        color: s.role === 'admin' ? '#1d4ed8' : '#374151',
                        fontSize: '0.85rem',
                      }}
                    >
                      {s.role ?? 'member'}
                    </span>
                  </td>
                  <td style={{ padding: '0.5rem', color: '#4b5563' }}>
                    {s.description || '—'}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Link
                      to="/scopes/$scope"
                      params={{ scope: s.name }}
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                      }}
                    >
                      Manage Scope
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Pending Invitations</h2>
        {invitationsList.length === 0 ? (
          <p style={{ fontStyle: 'italic' }}>
            No pending invitations for your email.
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
                <th style={{ padding: '0.5rem' }}>Scope</th>
                <th style={{ padding: '0.5rem' }}>Role Offered</th>
                <th style={{ padding: '0.5rem' }}>Invited At</th>
                <th style={{ padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitationsList.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>
                    {inv.scopeName ?? inv.scopeId}
                  </td>
                  <td style={{ padding: '0.5rem' }}>{inv.role}</td>
                  <td style={{ padding: '0.5rem' }}>
                    {new Date(inv.createdAt).toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: '0.5rem',
                      display: 'flex',
                      gap: '0.5rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleAcceptInvitation(inv.id)}
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineInvitation(inv.id)}
                      style={{
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #f87171',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section
        style={{
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          borderRadius: '6px',
        }}
      >
        <h2>Request a Custom Scope</h2>
        <p style={{ color: '#4b5563' }}>
          Custom scopes (like <code>@organization</code>) allow multiple team
          members to publish packages collaboratively under a shared namespace.
        </p>

        <form
          onSubmit={handleRequestScope}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: '500px',
          }}
        >
          <label>
            Scope Name:
            <input
              type="text"
              placeholder="@myorg"
              value={scopeNameInput}
              onChange={(e) => setScopeNameInput(e.target.value)}
              required
              style={{ width: '100%', padding: '0.4rem', marginTop: '0.25rem' }}
            />
          </label>
          <label>
            Reason / Justification:
            <textarea
              rows={3}
              placeholder="Explain why your project or organization needs this scope..."
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              required
              style={{ width: '100%', padding: '0.4rem', marginTop: '0.25rem' }}
            />
          </label>
          <button
            type="submit"
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Submit Scope Request
          </button>
        </form>
      </section>
    </div>
  );
}
