import { createFileRoute, Link } from '@tanstack/react-router';
import { createLogger } from '@unsa/logger';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button, buttonClasses } from '@/components/Button';
import { Card } from '@/components/Card';
import { TextInput } from '@/components/TextInput';
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
    logger.warn('Invalid tui_callback URL', { err });
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
      setError('URL de retorno inválida');
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
          : 'No se pudo autorizar el CLI. Inténtalo de nuevo.',
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
        <div className="max-w-md mx-auto px-4 py-10 font-sans">
          <Card>
            <h2 className="text-xl font-bold text-rose-400">
              URL de retorno inválida
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Por seguridad, la autorización del CLI solo admite direcciones
              locales (<code className="text-slate-200">127.0.0.1</code> o{' '}
              <code className="text-slate-200">localhost</code>).
            </p>
          </Card>
        </div>
      );
    }

    if (user) {
      if (authorizedPat) {
        return (
          <div className="max-w-md mx-auto px-4 py-10 font-sans">
            <Card>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                UNSAReport · CLI
              </p>
              <h2 className="text-xl font-bold text-emerald-400 mt-1">
                ✓ Autorización exitosa
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Se creó un token de acceso personal para tu sesión de terminal.
                Redirigiendo al CLI…
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mt-4 break-all font-mono text-xs text-slate-200">
                {authorizedPat}
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(authorizedPat);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? '¡Copiado!' : 'Copiar token'}
                </Button>
                {callbackUrlWithToken && (
                  <a
                    href={callbackUrlWithToken}
                    className={buttonClasses('secondary', 'md')}
                  >
                    Abrir retorno
                  </a>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-4">
                Si tu terminal no se actualizó automáticamente, cierra esta
                ventana y ejecuta:{' '}
                <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">
                  unsarep login --token {authorizedPat.slice(0, 18)}...
                </code>
              </p>
            </Card>
          </div>
        );
      }

      return (
        <div className="max-w-md mx-auto px-4 py-10 font-sans">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              UNSAReport · CLI
            </p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white mt-1">
              Autorizar el CLI de UNSAReport
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Una sesión de terminal en tu equipo solicita acceso a tu cuenta de
              UNSAReport.
            </p>

            <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl mt-4">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-700" />
              )}
              <div>
                <div className="font-bold text-slate-100">{user.name}</div>
                <div className="text-xs text-slate-400">{user.email}</div>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-xl mt-4"
              >
                {error}
              </div>
            )}

            <div className="mt-4">
              <TextInput
                label="Descripción del token"
                name="tokenName"
                id="tokenName"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col gap-1.5 mt-4">
              <label
                htmlFor="expiryDays"
                className="text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Vencimiento
              </label>
              <select
                id="expiryDays"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                disabled={submitting}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-50"
              >
                <option value={30}>30 días</option>
                <option value={90}>90 días (recomendado)</option>
                <option value={365}>1 año</option>
                <option value={0}>Sin vencimiento</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleAuthorizeCli}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Autorizando…' : 'Autorizar CLI'}
              </Button>
              <Button
                variant="secondary"
                onClick={handleCancelCli}
                disabled={submitting}
              >
                Cancelar
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto px-4 py-10 font-sans">
        <Card className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            UNSAReport · CLI
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mt-1">
            Inicia sesión para autorizar el CLI
          </h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">
            Inicia sesión en tu cuenta de UNSAReport para autorizar la sesión de
            terminal.
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <a
              href={googleUrl}
              className={buttonClasses('primary', 'md', 'w-full')}
            >
              Continuar con Google
            </a>
            <a
              href={githubUrl}
              className={buttonClasses('secondary', 'md', 'w-full')}
            >
              Continuar con GitHub
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 font-sans">
      <Card className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          UNSAReport
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
          Acceso
        </h1>
        {user ? (
          <div className="mt-2">
            <p className="text-sm text-slate-400">
              Sesión iniciada como{' '}
              <strong className="text-slate-100">{user.name}</strong> (
              {user.email}).
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto mt-6">
              <Link
                to="/auth/pat"
                className={buttonClasses('primary', 'md', 'w-full')}
              >
                Gestionar tokens de acceso
              </Link>
              <Link
                to="/scopes"
                className={buttonClasses('secondary', 'md', 'w-full')}
              >
                Ver mis scopes
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-slate-400 mb-6">
              Inicia sesión con tu proveedor de identidad.
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <a
                href={googleUrl}
                className={buttonClasses('primary', 'md', 'w-full')}
              >
                Continuar con Google
              </a>
              <a
                href={githubUrl}
                className={buttonClasses('secondary', 'md', 'w-full')}
              >
                Continuar con GitHub
              </a>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
