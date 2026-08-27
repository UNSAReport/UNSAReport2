import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import {
  createPatServerFn,
  deletePatServerFn,
  listPatsServerFn,
} from "@/lib/auth/server";

type PatItem = {
  id: string;
  name: string;
  scopes?: string[];
  createdAt?: string;
};

export const Route = createFileRoute("/auth/pat")({
  loader: async () => {
    try {
      const pats = (await listPatsServerFn()) as unknown as PatItem[];
      return { pats };
    } catch {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: PatComponent,
});

function PatComponent() {
  const loaderData = Route.useLoaderData();
  const [pats, setPats] = useState<PatItem[]>(loaderData.pats);
  const [name, setName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNewToken(null);
    try {
      const res = await createPatServerFn({ data: { name } });
      setNewToken(res.token);
      setName("");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deletePatServerFn({ data: { id } });
      setPats((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div>
      <h1>Personal Access Tokens</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {newToken && (
        <div style={{ border: "1px solid green", padding: "0.5rem" }}>
          <p>Copy token now — it will not be shown again:</p>
          <code>{newToken}</code>
        </div>
      )}
      <form onSubmit={handleCreate}>
        <input
          placeholder="Token name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <button type="submit">Create PAT</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pats.length === 0 ? (
            <tr>
              <td colSpan={3}>No PATs</td>
            </tr>
          ) : (
            pats.map((pat) => (
              <tr key={pat.id}>
                <td>{pat.id}</td>
                <td>{pat.name}</td>
                <td>
                  <button type="button" onClick={() => handleDelete(pat.id)}>
                    Revoke
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
