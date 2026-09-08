import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { fetchCurrentUser } from "@/lib/auth-server";

const loginSearchSchema = z.object({
  error: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => loginSearchSchema.parse(search),
  beforeLoad: async () => {
    const user = await fetchCurrentUser();
    if (user) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { error } = Route.useSearch();

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 font-sans text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="UNSA Slides Icon"
            >
              <title>UNSA Slides Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            UNSA Slides Cloud
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage and present your slides
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-400">
            {error === "missing_code" &&
              "Authorization was cancelled or failed."}
            {error === "oauth_failed" &&
              "Failed to authenticate with Google. Please try again."}
            {error !== "missing_code" &&
              error !== "oauth_failed" &&
              "An error occurred during authentication."}
          </div>
        )}

        <div className="space-y-4">
          <a
            href="/api/v1/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 hover:shadow-lg active:scale-[0.98]"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Google Icon"
            >
              <title>Google Logo</title>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </a>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative bg-slate-900/90 px-3 text-xs uppercase text-slate-500">
              Developer Workflow
            </span>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/30 p-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-300">
              💡 Author locally with CLI:
            </p>
            <p className="mt-1 font-mono text-cyan-400">slides init my-deck</p>
            <p className="font-mono text-cyan-400">slides dev</p>
            <p className="font-mono text-cyan-400">slides deploy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
