import { createFileRoute, Link } from '@tanstack/react-router';
import { createLogger } from '@unsa/logger';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button, buttonClasses } from '@/components/Button';
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

const accessSteps = [
  {
    index: '01',
    title: 'Inicia sesión',
    body: 'Google o GitHub como proveedor de identidad.',
  },
  {
    index: '02',
    title: 'Conecta tus espacios',
    body: 'Scopes, organizaciones y tokens de acceso personal.',
  },
  {
    index: '03',
    title: 'Publica y presenta',
    body: 'Despliega slides y paquetes versionados e inmutables.',
  },
];

function LoginSplit({
  eyebrow,
  panelLabel,
  children,
}: {
  eyebrow: string;
  panelLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#E3E2DE] text-[#141414] font-sans grid grid-cols-12 border-b border-[#C7C7C7]">
      <div className="col-span-12 md:col-span-7 bg-[#141414] text-[#E3E2DE] p-6 md:p-12 flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="block w-4 h-4 bg-[#E3E2DE]" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7A7A7A]">
            {eyebrow}
          </p>
        </div>
        <h1 className="poster-headline uppercase text-5xl md:text-7xl">
          Entra.
          <br />
          Publica.
          <br />
          <span className="text-[#1351AA]">Defiende.</span>
        </h1>
        <p className="max-w-[400px] text-base text-[#C7C7C7] leading-relaxed">
          Una sola identidad para informes reproducibles, paquetes versionados
          y slides académicas: todo el flujo institucional UNSA.
        </p>
        <ol className="mt-auto pt-8 space-y-0">
          {accessSteps.map((s) => (
            <li
              key={s.index}
              className="flex items-start gap-6 border-t border-[#444343] py-5"
            >
              <p className="font-mono text-xs text-[#7A7A7A] pt-1 shrink-0 w-8">
                {s.index}
              </p>
              <div>
                <p className="font-bold leading-tight">{s.title}</p>
                <p className="text-sm text-[#C7C7C7] mt-1">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="col-span-12 md:col-span-5 p-6 md:p-12 flex flex-col gap-6">
        <p className="grid-label md:sticky md:top-32">{panelLabel}</p>
        <div className="border border-[#C7C7C7] p-6 md:p-8 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
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
        <LoginSplit eyebrow="UNSAReport · CLI" panelLabel="Error">
          <h2 className="text-xl font-bold text-red-700">
            URL de retorno inválida
          </h2>
          <p className="text-sm text-[#444343] leading-relaxed">
            Por seguridad, la autorización del CLI solo admite direcciones
            locales (<code className="text-[#141414]">127.0.0.1</code> o{' '}
            <code className="text-[#141414]">localhost</code>).
          </p>
        </LoginSplit>
      );
    }

    if (user) {
      if (authorizedPat) {
        return (
          <LoginSplit eyebrow="UNSAReport · CLI" panelLabel="Autorización">
            <h2 className="text-xl font-bold text-green-700">
              ✓ Autorización exitosa
            </h2>
            <p className="text-sm text-[#444343] leading-relaxed">
              Se creó un token de acceso personal para tu sesión de terminal.
              Redirigiendo al CLI…
            </p>
            <div className="bg-[#141414] border border-[#C7C7C7] rounded-none p-3 break-all font-mono text-xs text-[#E3E2DE]">
              {authorizedPat}
            </div>
            <div className="flex flex-wrap gap-3">
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
            <p className="text-xs text-[#7A7A7A]">
              Si tu terminal no se actualizó automáticamente, cierra esta
              ventana y ejecuta:{' '}
              <code className="bg-[#141414] px-1.5 py-0.5 rounded-none text-[#E3E2DE]">
                unsarep login --token {authorizedPat.slice(0, 18)}...
              </code>
            </p>
          </LoginSplit>
        );
      }

      return (
        <LoginSplit eyebrow="UNSAReport · CLI" panelLabel="Autorizar">
          <h2 className="text-2xl font-extrabold tracking-tight text-[#141414]">
            Autorizar el CLI de UNSAReport
          </h2>
          <p className="text-sm text-[#444343] leading-relaxed">
            Una sesión de terminal en tu equipo solicita acceso a tu cuenta de
            UNSAReport.
          </p>

          <div className="flex items-center gap-3 p-3 bg-transparent border border-[#C7C7C7] rounded-none">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-none"
              />
            ) : (
              <div className="w-10 h-10 rounded-none bg-[#141414] text-[#E3E2DE]" />
            )}
            <div>
              <div className="font-bold text-[#141414]">{user.name}</div>
              <div className="text-xs text-[#444343]">{user.email}</div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="text-sm text-red-700 bg-transparent border border-[#C7C7C7] px-3 py-2 rounded-none"
            >
              {error}
            </div>
          )}

          <TextInput
            label="Descripción del token"
            name="tokenName"
            id="tokenName"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            disabled={submitting}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="expiryDays" className="grid-label">
              Vencimiento
            </label>
            <select
              id="expiryDays"
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              disabled={submitting}
              className="w-full px-3.5 py-2 rounded-none bg-transparent border border-[#C7C7C7] text-sm text-[#141414] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1351AA]/50 disabled:opacity-50"
            >
              <option value={30}>30 días</option>
              <option value={90}>90 días (recomendado)</option>
              <option value={365}>1 año</option>
              <option value={0}>Sin vencimiento</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
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
        </LoginSplit>
      );
    }

    return (
      <LoginSplit eyebrow="UNSAReport · CLI" panelLabel="Sign in">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#141414]">
          Inicia sesión para autorizar el CLI
        </h2>
        <p className="text-sm text-[#444343] leading-relaxed">
          Inicia sesión en tu cuenta de UNSAReport para autorizar la sesión de
          terminal.
        </p>
        <div className="flex flex-col gap-3">
          <a href={googleUrl} className={buttonClasses('primary', 'md', 'w-full')}>
            Continuar con Google
          </a>
          <a
            href={githubUrl}
            className={buttonClasses('secondary', 'md', 'w-full')}
          >
            Continuar con GitHub
          </a>
        </div>
      </LoginSplit>
    );
  }

  return (
    <LoginSplit eyebrow="UNSAReport · Acceso" panelLabel="Sign in">
      <h1 className="text-3xl font-extrabold tracking-tight text-[#141414]">
        Acceso
      </h1>
      {user ? (
        <div className="space-y-6">
          <p className="text-sm text-[#444343] leading-relaxed">
            Sesión iniciada como{' '}
            <strong className="text-[#141414]">{user.name}</strong> (
            {user.email}).
          </p>
          <div className="flex flex-col gap-3">
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
        <div className="space-y-6">
          <p className="text-sm text-[#444343] leading-relaxed">
            Inicia sesión con tu proveedor de identidad.
          </p>
          <div className="flex flex-col gap-3">
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
    </LoginSplit>
  );
}
