import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
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
    <div>
      <h1>Personal Access Tokens</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {newToken && (
        <div
          style={{
            border: '1px solid #16a34a',
            backgroundColor: '#f0fdf4',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}
        >
          <p style={{ fontWeight: 'bold', color: '#15803d', margin: 0 }}>
            Personal Access Token Created
          </p>
          <p
            style={{
              margin: '0.5rem 0',
              fontSize: '0.9rem',
              color: '#166534',
            }}
          >
            Copy token now — it will not be shown again:
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <code
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #bbf7d0',
                padding: '0.4rem 0.6rem',
                borderRadius: '4px',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                flex: 1,
              }}
            >
              {newToken}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(newToken);
                setCopied(true);
              }}
              style={{ padding: '0.4rem 0.8rem', cursor: 'pointer' }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleCreate}>
        <input
          placeholder="Token name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit">Create PAT</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pats.length === 0 ? (
            <tr>
              <td colSpan={3}>No PATs</td>
            </tr>
          ) : (
            pats.map((pat) => (
              <tr key={pat.id}>
                <td>{pat.id}</td>
                <td>{pat.name}</td>
                <td>
                  <button type="button" onClick={() => handleDelete(pat.id)}>
                    Revoke
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
