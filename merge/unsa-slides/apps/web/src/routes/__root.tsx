import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";
import { fetchCurrentUser, logoutFn } from "@/lib/auth-server";
import "@/index.css";

export const Route = createRootRoute({
  beforeLoad: async () => {
    const user = await fetchCurrentUser();
    return { user };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "UNSA Slides - Cloud Slides Management" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { user } = Route.useRouteContext();

  const handleLogout = async () => {
    try {
      await logoutFn();
    } catch {
      // fallback
    }
    window.location.href = "/api/v1/auth/logout";
  };

  return (
    <RootDocument>
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-md sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-bold tracking-tight text-white no-underline"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white shadow-md shadow-indigo-500/20">
              S
            </div>
            <span>UNSA Slides</span>
          </Link>

          <nav className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  Presentations
                </Link>
                <Link
                  to="/settings/tokens"
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  API Tokens
                </Link>
                <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                  {user.avatarUrl && (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-7 w-7 rounded-full ring-1 ring-white/20"
                    />
                  )}
                  <span className="hidden text-xs font-medium text-slate-300 sm:inline">
                    {user.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="ml-2 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Sign In
              </Link>
            )}
          </nav>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
      <TanStackRouterDevtools />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
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
