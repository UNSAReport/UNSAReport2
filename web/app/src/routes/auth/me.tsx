import { createFileRoute, Link } from '@tanstack/react-router';
import { buttonClasses } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { fetchCurrentUser } from '@/lib/auth/server';

export const Route = createFileRoute('/auth/me')({
  loader: async () => {
    const user = await fetchCurrentUser();
    return { user };
  },
  component: MeComponent,
});

function MeComponent() {
  const { user } = Route.useLoaderData();
  return (
    <div className="max-w-md mx-auto px-4 py-10 font-sans">
      <Card labelledBy="me-heading">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          UNSAReport · Cuenta
        </p>
        <h1
          id="me-heading"
          className="text-3xl font-extrabold tracking-tight text-white mt-1"
        >
          Mi cuenta
        </h1>
        {user ? (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-200"
                >
                  {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-100">{user.name}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
            {user.roles && Object.keys(user.roles).length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Roles
                </p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(user.roles).map(([subApp, role]) => (
                    <li
                      key={subApp}
                      className="text-xs px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200"
                    >
                      {subApp}: {String(role)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex flex-col gap-3 mt-6">
              <Link
                to="/scopes"
                className={buttonClasses('primary', 'md', 'w-full')}
              >
                Ver mis scopes e invitaciones →
              </Link>
              <Link
                to="/auth/pat"
                className={buttonClasses('secondary', 'md', 'w-full')}
              >
                Gestionar tokens de acceso
              </Link>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Endpoint directo:{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">
                GET /api/auth/v1/me
              </code>{' '}
              (vía IDP)
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="Sin sesión"
              body="No hay una sesión válida. Inicia sesión para ver tu cuenta."
              action={
                <Link
                  to="/auth/login"
                  className={buttonClasses('primary', 'md')}
                >
                  Ir a Acceso
                </Link>
              }
            />
            <p className="text-xs text-slate-500 mt-4 text-center">
              Endpoint directo:{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">
                GET /api/auth/v1/me
              </code>{' '}
              (vía IDP)
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
