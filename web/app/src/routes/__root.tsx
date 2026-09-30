import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouter,
} from '@tanstack/react-router';
import { createLogger } from '@unsa/logger';
import { useEffect } from 'react';
import { z } from 'zod';
import { buttonClasses } from '@/components/Button';
import {
  DEFAULT_ACCESS_TOKEN_TTL_SECONDS,
  fetchCurrentUser,
  logoutFn,
  setSessionTokenServerFn,
} from '@/lib/auth/server';
import '@/index.css';

const TuiAuthPendingSchema = z.object({
  tui_callback: z.string().min(1).optional(),
  state: z.string().optional(),
});

const logger = createLogger('web');

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
          let raw: unknown;
          try {
            raw = JSON.parse(pending);
          } catch {
            sessionStorage.removeItem('tui_auth_pending');
            throw new Error('Invalid tui_auth_pending: malformed JSON');
          }
          const parsed = TuiAuthPendingSchema.safeParse(raw);
          if (!parsed.success) {
            sessionStorage.removeItem('tui_auth_pending');
            throw new Error(
              `Invalid tui_auth_pending: ${parsed.error.message}`,
            );
          }
          const { tui_callback, state } = parsed.data;
          sessionStorage.removeItem('tui_auth_pending');
          if (tui_callback) {
            window.location.href = `/auth/login?tui_callback=${encodeURIComponent(tui_callback)}&state=${encodeURIComponent(state ?? '')}`;
            return;
          }
        }
      })
      .catch((err: unknown) => {
        logger.error('Failed to consume auth token from URL hash', { err });
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
  const router = useRouter();
  const { user } = Route.useRouteContext();

  const handleLogout = async () => {
    await logoutFn();
    router.invalidate();
    window.location.href = '/';
  };

  const hasAnyAdminRole = user?.roles
    ? Object.values(user.roles).includes('admin')
    : false;

  return (
    <RootDocument>
      <AuthHashConsumer />
      <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 min-h-14 py-2 flex flex-wrap items-center gap-1">
          <Link
            to="/"
            className="font-bold text-white mr-2 flex items-center gap-2 px-1 py-2"
          >
            UNSAReport
          </Link>
          <span className="text-sm text-slate-500 px-1 py-2">
            Plataforma institucional UNSA
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1">
            {!user ? (
              <Link to="/auth/login" className={buttonClasses('primary', 'sm')}>
                Login
              </Link>
            ) : null}
            {user ? (
              <>
                <Link
                  to="/auth/me"
                  className="text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/80 transition-colors"
                  activeProps={{
                    className:
                      'text-sm text-white bg-slate-800 px-3 py-2 rounded-lg transition-colors',
                  }}
                >
                  Me
                </Link>
                <Link
                  to="/scopes"
                  className="text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/80 transition-colors"
                  activeProps={{
                    className:
                      'text-sm text-white bg-slate-800 px-3 py-2 rounded-lg transition-colors',
                  }}
                >
                  Scopes
                </Link>
                <Link
                  to="/auth/pat"
                  className="text-sm text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800/80 transition-colors"
                  activeProps={{
                    className:
                      'text-sm text-white bg-slate-800 px-3 py-2 rounded-lg transition-colors',
                  }}
                >
                  PATs
                </Link>
              </>
            ) : null}
            {hasAnyAdminRole ? (
              <Link
                to="/admin"
                className="text-sm font-semibold text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-slate-800/80 transition-colors"
                activeProps={{
                  className:
                    'text-sm font-semibold text-red-300 bg-slate-800 px-3 py-2 rounded-lg transition-colors',
                }}
              >
                Admin
              </Link>
            ) : null}
            {user ? (
              <>
                <span className="hidden md:block text-xs text-slate-500 px-2">
                  {user.email} ({user.name})
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-semibold text-red-300 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </nav>
      <main className="px-4 py-6">
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
