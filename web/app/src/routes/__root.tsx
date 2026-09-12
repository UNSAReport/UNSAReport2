import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import {
  DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
  fetchCurrentUser,
  setSessionTokenServerFn,
} from '@/lib/auth/server';
import '@/index.css';

export const Route = createRootRoute({
  beforeLoad: async () => {
    const user = await fetchCurrentUser();
    return { user };
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'UNSAReport' },
    ],
  }),
  notFoundComponent: RootNotFoundComponent,
  component: RootComponent,
});

function AuthHashConsumer() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) {
      return;
    }

    const rawHash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;
    const params = new URLSearchParams(rawHash);
    const accessToken = params.get('access_token');
    if (!accessToken) {
      return;
    }

    const expiresInParam = params.get('expires_in');
    const expiresIn = expiresInParam
      ? Number.parseInt(expiresInParam, 10)
      : DEFAULT_ACCESS_TOKEN_TTL_SECONDS;

    setSessionTokenServerFn({ data: { accessToken, expiresIn } })
      .then(() => {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search,
        );
        router.invalidate();

        const pending = sessionStorage.getItem('tui_auth_pending');
        if (pending) {
          try {
            const { tui_callback, state } = JSON.parse(pending) as {
              tui_callback?: string;
              state?: string;
            };
            sessionStorage.removeItem('tui_auth_pending');
            if (tui_callback) {
              window.location.href = `/auth/login?tui_callback=${encodeURIComponent(tui_callback)}&state=${encodeURIComponent(state ?? '')}`;
              return;
            }
          } catch {
            sessionStorage.removeItem('tui_auth_pending');
          }
        }
      })
      .catch((err: unknown) => {
        console.error('Failed to consume auth token from URL hash:', err);
      });
  }, [router]);

  return null;
}

function RootNotFoundComponent() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
        404 - Not Found
      </h2>
      <p style={{ marginTop: '0.5rem', color: '#666' }}>
        The page you are looking for does not exist.
      </p>
      <p style={{ marginTop: '1rem' }}>
        <a href="/" style={{ color: '#0066cc', textDecoration: 'underline' }}>
          Back to Home
        </a>
      </p>
    </div>
  );
}

function RootComponent() {
  const { user } = Route.useRouteContext();
  return (
    <RootDocument>
      <AuthHashConsumer />
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
        <a href="/">/</a> | <a href="/registry">Registry</a> |{' '}
        <a href="/presentations/microphoto">Slides</a> |{' '}
        <a href="/auth/login">Login</a> | <a href="/auth/me">Me</a> |{' '}
        <a href="/auth/pat">PATs</a>
        {user ? (
          <span style={{ marginLeft: '1rem' }}>
            — {user.email} ({user.name})
          </span>
        ) : (
          <span style={{ marginLeft: '1rem' }}>— not logged in</span>
        )}
      </nav>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
