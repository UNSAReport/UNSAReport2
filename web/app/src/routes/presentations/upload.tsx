import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { DeployForm } from '@/components/DeployForm';
import { requireAuthServerFn } from '@/lib/auth/server';

export const Route = createFileRoute('/presentations/upload')({
  beforeLoad: async () => {
    try {
      await requireAuthServerFn();
    } catch {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: UploadPresentationComponent,
});

function UploadPresentationComponent() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 font-sans">
      <header className="border-b border-slate-700/60 pb-6">
        <Link
          to="/presentations"
          className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          ← Volver a presentaciones
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
          Publicar presentación
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Sube el bundle .zip generado por el CLI y publícalo como una nueva
          versión. Prefiere <code>unsarep slides deploy</code> desde tu
          terminal; este formulario es la vía web equivalente.
        </p>
      </header>
      <DeployForm />
    </div>
  );
}
