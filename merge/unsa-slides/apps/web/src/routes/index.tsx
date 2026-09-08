import { createFileRoute, Link } from "@tanstack/react-router";
import { fetchCurrentUser } from "@/lib/auth-server";
import { presentations } from "@/lib/presentations";

export const Route = createFileRoute("/")({
  loader: async () => {
    const user = await fetchCurrentUser();
    return { user };
  },
  component: IndexPage,
});

function IndexPage() {
  const { user } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-14 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-medium text-indigo-400">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Cloud Slides Management Platform
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Author locally with{" "}
          <span className="bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            CLI
          </span>
          .
          <br />
          Present anywhere in the{" "}
          <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Cloud
          </span>
          .
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400 sm:text-lg">
          Create presentations in React & Reveal.js using the UNSA Slides CLI,
          preview them locally with hot reload, and deploy them seamlessly for
          organizations and dual-screen present mode.
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          {user ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm text-slate-300">
              Welcome back,{" "}
              <span className="font-semibold text-white">{user.name}</span>!
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 hover:shadow-indigo-500/40"
            >
              Get Started with Google OAuth
            </Link>
          )}
        </div>
      </div>

      {/* CLI Quickstart Guide */}
      <div className="mb-14 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <h2 className="mb-4 text-xl font-bold text-white">
          ⚡ Developer Quickstart
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/5 bg-black/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              1. Initialize
            </span>
            <p className="mt-1 font-mono text-xs text-slate-300">
              bunx slides init my-deck
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Scaffolds a slide deck with Reveal.js and ready-to-edit templates.
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              2. Dev Preview
            </span>
            <p className="mt-1 font-mono text-xs text-slate-300">
              bunx slides dev
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Fast local preview server with instant hot reload.
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-black/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              3. Deploy to Cloud
            </span>
            <p className="mt-1 font-mono text-xs text-slate-300">
              bunx slides deploy
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Publishes deck to cloud for team sharing and presenter mode.
            </p>
          </div>
        </div>
      </div>

      {/* Available Presentations */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            Presentations Gallery
          </h2>
          <span className="text-xs text-slate-400">
            {presentations.length}{" "}
            {presentations.length === 1 ? "presentation" : "presentations"}
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {presentations.map((p) => (
            <div
              key={p.path}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-200 hover:border-indigo-500/40 hover:bg-white/10 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-400">
                    Live Deck
                  </span>
                  <span className="text-xs text-slate-500">v1.0.0</span>
                </div>
                <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {p.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-2 pt-4 border-t border-white/5">
                <Link
                  to={p.path}
                  className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-center text-xs font-medium text-slate-200 transition hover:bg-white/20 hover:text-white"
                >
                  View Slides
                </Link>
                <Link
                  to={p.path}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-500"
                >
                  Present
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
