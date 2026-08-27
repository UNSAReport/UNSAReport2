import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { fetchCurrentUser } from "@/lib/auth/server";
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
      { title: "UNSAReport" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { user } = Route.useRouteContext();
  return (
    <RootDocument>
      <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
        <a href="/">/</a> | <a href="/registry">Registry</a> |{" "}
        <a href="/auth/login">Login</a> | <a href="/auth/me">Me</a> |{" "}
        <a href="/auth/pat">PATs</a>
        {user ? (
          <span style={{ marginLeft: "1rem" }}>
            — {user.email} ({user.name})
          </span>
        ) : (
          <span style={{ marginLeft: "1rem" }}>— not logged in</span>
        )}
      </nav>
      <main style={{ padding: "1rem" }}>
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
