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
    <div className="max-w-md mx-auto px-4 py-10 font-sans bg-[#E3E2DE] text-[#141414]">
      <Card labelledBy="me-heading">
        <p className="grid-label">
          UNSAReport · Cuenta
        </p>
        <h1
          id="me-heading"
          className="text-3xl font-extrabold tracking-tight text-[#141414] mt-1"
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
                  className="w-12 h-12 rounded-none"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="w-12 h-12 rounded-none bg-[#141414] flex items-center justify-center text-lg font-bold text-[#E3E2DE]"
                >
                  {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-bold text-[#141414]">{user.name}</p>
                <p className="text-sm text-[#444343]">{user.email}</p>
              </div>
            </div>
            {user.roles && Object.keys(user.roles).length > 0 ? (
              <div className="mt-4">
                <p className="grid-label">
                  Roles
                </p>
                <ul className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(user.roles).map(([subApp, role]) => (
                    <li
                      key={subApp}
                      className="text-xs px-2 py-1 rounded-none bg-[#141414] border border-[#C7C7C7] text-[#E3E2DE]"
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
            <p className="text-xs text-[#7A7A7A] mt-4">
              Endpoint directo:{' '}
              <code className="bg-[#141414] px-1.5 py-0.5 rounded-none text-[#E3E2DE]">
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
            <p className="text-xs text-[#7A7A7A] mt-4 text-center">
              Endpoint directo:{' '}
              <code className="bg-[#141414] px-1.5 py-0.5 rounded-none text-[#E3E2DE]">
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
