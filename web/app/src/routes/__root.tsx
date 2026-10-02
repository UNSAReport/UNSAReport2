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
      <nav className="sticky top-0 z-40 h-20 bg-[#E3E2DE]/95 backdrop-blur border-b border-[#C7C7C7]">
        <div className="h-full max-w-none mx-auto px-6 grid grid-cols-12 items-center gap-4">
          <Link
            to="/"
            className="col-span-3 font-black uppercase tracking-tight text-[#141414] text-lg leading-none"
          >
            UNSAReport
          </Link>
          <div className="col-span-6 hidden md:flex items-center gap-3">
            {user ? (
              <span className="grid-label normal-case tracking-normal font-mono text-[11px]">
                {user.email} · {user.name}
              </span>
            ) : (
              <span className="grid-label">Plataforma institucional UNSA</span>
            )}
          </div>
          <div className="col-span-9 md:col-span-3 flex items-center justify-end gap-5">
            {user ? (
              <Link
                to="/dashboard"
                className="text-sm font-semibold text-[#141414] uppercase tracking-wider transition-colors duration-300 hover:text-[#1351AA]"
              >
                Dashboard
              </Link>
            ) : null}
            {hasAnyAdminRole ? (
              <Link
                to="/admin"
                className="text-sm font-semibold text-[#141414] uppercase tracking-wider transition-colors duration-300 hover:text-[#1351AA]"
              >
                Admin
              </Link>
            ) : null}
            {!user ? (
              <Link
                to="/auth/login"
                className="text-sm font-semibold text-[#141414] uppercase tracking-wider transition-colors duration-300 hover:text-[#1351AA]"
              >
                Acceso
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="text-sm font-semibold text-[#141414] uppercase tracking-wider transition-colors duration-300 hover:text-[#1351AA] cursor-pointer"
              >
                Salir
              </button>
            )}
          </div>
        </div>
      </nav>
      <main>
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
