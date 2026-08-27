import { createFileRoute } from "@tanstack/react-router";
import { fetchCurrentUser } from "@/lib/auth/server";

export const Route = createFileRoute("/auth/me")({
  loader: async () => {
    const user = await fetchCurrentUser();
    return { user };
  },
  component: MeComponent,
});

function MeComponent() {
  const { user } = Route.useLoaderData();
  return (
    <div>
      <h1>Current User</h1>
      {user ? (
        <pre>{JSON.stringify(user, null, 2)}</pre>
      ) : (
        <p>Not authenticated — no valid token found.</p>
      )}
      <p>
        Raw endpoint: <code>GET /api/v1/auth/me</code> (proxied to IDP)
      </p>
    </div>
  );
}
