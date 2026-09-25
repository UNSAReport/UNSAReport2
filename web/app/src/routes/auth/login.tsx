import { createFileRoute } from '@tanstack/react-router';
import { createLogger } from '@unsa/logger';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import {
  authorizeCliServerFn,
  fetchCurrentUser,
  getGithubLoginUrlServerFn,
  getGoogleLoginUrlServerFn,
} from '@/lib/auth/server';

const logger = createLogger('web');

const loginSearchSchema = z.object({
  tui_callback: z.string().optional(),
  state: z.string().optional(),
});

export const Route = createFileRoute('/auth/login')({
  validateSearch: loginSearchSchema,
  loader: async () => {
    const user = await fetchCurrentUser();
    return { user };
  },
  component: LoginComponent,
});

function isLoopback(callbackUrl?: string): boolean {
  if (!callbackUrl) return false;
  try {
    const u = new URL(callbackUrl);
    return (
      u.protocol === 'http:' &&
      (u.hostname === '127.0.0.1' || u.hostname === 'localhost')
    );
  } catch (err) {
    logger.warn('Invalid callback URL', { err });
    return false;
  }
}

function LoginComponent() {
  const { user } = Route.useLoaderData();
  const search = Route.useSearch();
  const { tui_callback, state } = search;

  const [googleUrl, setGoogleUrl] = useState<string>('/api/auth/v1/google');
  const [githubUrl, setGithubUrl] = useState<string>('/api/auth/v1/github');

  const [tokenName, setTokenName] = useState<string>(
    `unsarep CLI (${new Date().toISOString().slice(0, 10)})`,
  );
  const [expiryDays, setExpiryDays] = useState<number>(90);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authorizedPat, setAuthorizedPat] = useState<string | null>(null);
  const [callbackUrlWithToken, setCallbackUrlWithToken] = useState<
    string | null
  >(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    getGoogleLoginUrlServerFn()
      .then(setGoogleUrl)
      .catch(() => {});
    getGithubLoginUrlServerFn()
      .then(setGithubUrl)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tui_callback && isLoopback(tui_callback) && !user) {
      sessionStorage.setItem(
        'tui_auth_pending',
        JSON.stringify({ tui_callback, state: state ?? '' }),
      );
    }
  }, [tui_callback, state, user]);

  const handleAuthorizeCli = async () => {
    if (!tui_callback || !isLoopback(tui_callback)) {
      setError('Invalid callback URL');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await authorizeCliServerFn({
        data: {
          tui_callback,
          state: state ?? '',
          name: tokenName,
          expires_in_days: expiryDays > 0 ? expiryDays : null,
        },
      });

      const redirectUrl = new URL(tui_callback);
      redirectUrl.searchParams.set('pat', res.token);
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }
      setAuthorizedPat(res.token);
      setCallbackUrlWithToken(redirectUrl.toString());
      window.location.href = redirectUrl.toString();
    } catch (err: unknown) {
      setSubmitting(false);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to authorize CLI. Please try again.',
      );
    }
  };

  const handleCancelCli = () => {
    if (tui_callback && isLoopback(tui_callback)) {
      const redirectUrl = new URL(tui_callback);
      redirectUrl.searchParams.set('error', 'cancelled');
      if (state) {
        redirectUrl.searchParams.set('state', state);
      }
      window.location.href = redirectUrl.toString();
    }
  };

  if (tui_callback) {
    if (!isLoopback(tui_callback)) {
      return (
        <div
          style={{ maxWidth: '480px', margin: '2rem auto', padding: '1rem' }}
        >
          <h2 style={{ color: '#dc2626' }}>Invalid Callback URL</h2>
          <p>
            For security reasons, CLI authorization callbacks must point to a
            local loopback address (<code>127.0.0.1</code> or{' '}
            <code>localhost</code>).
          </p>
        </div>
      );
    }

    if (user) {
      if (authorizedPat) {
        return (
          <div
            style={{
              maxWidth: '520px',
              margin: '2rem auto',
              padding: '1.5rem',
              border: '1px solid #bbf7d0',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}
          >
            <h2 style={{ margin: '0 0 0.75rem 0', color: '#16a34a' }}>
              ✓ Authorization Successful
            </h2>
            <p style={{ color: '#374151', margin: '0 0 1rem 0' }}>
              A personal access token was created for your terminal session.
              Redirecting to CLI...
            </p>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.75rem',
                marginBottom: '1rem',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                color: '#0f172a',
              }}
            >
              {authorizedPat}
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(authorizedPat);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Token'}
              </button>
              {callbackUrlWithToken && (
                <a
                  href={callbackUrlWithToken}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontWeight: '500',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  Open Callback
                </a>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              If your terminal didn't update automatically, you can close this
              window and run:{' '}
              <code
                style={{
                  background: '#e2e8f0',
                  padding: '0.15rem 0.35rem',
                  borderRadius: '3px',
                }}
              >
                unsarep login --token {authorizedPat.slice(0, 18)}...
              </code>
            </p>
          </div>
        );
      }

      return (
        <div
          style={{
            maxWidth: '520px',
            margin: '2rem auto',
            padding: '1.5rem',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ margin: '0 0 1rem 0' }}>Authorize UNSAReport CLI</h2>
          <p style={{ color: '#4b5563', margin: '0 0 1.25rem 0' }}>
            A terminal session on your computer is requesting access to your
            UNSAReport account.
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              marginBottom: '1.25rem',
            }}
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
              />
            ) : (
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#cbd5e1',
                }}
              />
            )}
            <div>
              <div style={{ fontWeight: 'bold' }}>{user.name}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {user.email}
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                color: '#dc2626',
                backgroundColor: '#fef2f2',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="tokenName"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '500',
                marginBottom: '0.35rem',
              }}
            >
              Token Description:
            </label>
            <input
              id="tokenName"
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="expiryDays"
              style={{
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '500',
                marginBottom: '0.35rem',
              }}
            >
              Expiration:
            </label>
            <select
              id="expiryDays"
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
              }}
            >
              <option value={30}>30 days</option>
              <option value={90}>90 days (recommended)</option>
              <option value={365}>1 year</option>
              <option value={0}>No expiration</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleAuthorizeCli}
              disabled={submitting}
              style={{
                flex: 1,
                padding: '0.6rem 1rem',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Authorizing...' : 'Authorize CLI'}
            </button>
            <button
              type="button"
              onClick={handleCancelCli}
              disabled={submitting}
              style={{
                padding: '0.6rem 1rem',
                backgroundColor: '#e2e8f0',
                color: '#334155',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          maxWidth: '480px',
          margin: '2rem auto',
          padding: '1.5rem',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          textAlign: 'center',
        }}
      >
        <h2>Sign In to Authorize CLI</h2>
        <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
          Please sign in to your UNSAReport account to authorize the terminal
          session.
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            maxWidth: '280px',
            margin: '0 auto',
          }}
        >
          <a href={googleUrl} style={{ textDecoration: 'none' }}>
            <button
              type="button"
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                cursor: 'pointer',
              }}
            >
              Sign in with Google
            </button>
          </a>
          <a href={githubUrl} style={{ textDecoration: 'none' }}>
            <button
              type="button"
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                cursor: 'pointer',
              }}
            >
              Sign in with GitHub
            </button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Login</h1>
      {user ? (
        <div>
          <p>
            You are signed in as <strong>{user.name}</strong> ({user.email}).
          </p>
          <p>
            Manage tokens at <a href="/auth/pat">Personal Access Tokens</a>.
          </p>
        </div>
      ) : (
        <div>
          <p>Sign in via Identity Provider.</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href={googleUrl}>
              <button type="button">Login with Google</button>
            </a>
            <a href={githubUrl}>
              <button type="button">Login with GitHub</button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
