import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { requireAuthServerFn } from "@/lib/auth-server";
import {
  createUserTokenServerFn,
  listUserTokensServerFn,
  revokeUserTokenServerFn,
} from "@/lib/tokens-server";

export const Route = createFileRoute("/settings/tokens")({
  beforeLoad: async () => {
    await requireAuthServerFn();
  },
  loader: async () => {
    const tokens = await listUserTokensServerFn();
    return { tokens };
  },
  component: ApiTokensPage,
});

function ApiTokensPage() {
  const { tokens: initialTokens } = Route.useLoaderData();
  const [tokens, setTokens] = useState(initialTokens);
  const [tokenName, setTokenName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newTokenResult, setNewTokenResult] = useState<{
    name: string;
    token: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenName.trim()) return;

    setIsCreating(true);
    try {
      const res = await createUserTokenServerFn({
        data: { name: tokenName.trim() },
      });
      setNewTokenResult(res);
      setTokenName("");
      const updated = await listUserTokensServerFn();
      setTokens(updated);
    } catch (_err: unknown) {
      alert("Failed to create token.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (tokenId: string) => {
    if (!confirm("Are you sure you want to revoke this API token?")) return;

    try {
      await revokeUserTokenServerFn({ data: { tokenId } });
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
    } catch (_err: unknown) {
      alert("Failed to revoke token.");
    }
  };

  const handleCopy = () => {
    if (!newTokenResult) return;
    navigator.clipboard.writeText(newTokenResult.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          API Tokens
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage personal API keys for authoring and publishing slides via the
          UNSA Slides CLI.
        </p>
      </div>

      {newTokenResult && (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-emerald-300">
              New Token Created: {newTokenResult.name}
            </h3>
            <button
              type="button"
              onClick={() => setNewTokenResult(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Make sure to copy your personal access token now. You won't be able
            to see it again!
          </p>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="text"
              readOnly
              value={newTokenResult.token}
              className="flex-1 rounded-xl border border-emerald-500/30 bg-black/50 px-4 py-2.5 font-mono text-sm text-emerald-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        {/* Create Token Form */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 md:col-span-1">
          <h2 className="text-base font-semibold text-white">Generate Token</h2>
          <p className="mt-1 text-xs text-slate-400">
            Create a token to authenticate the CLI on remote machines.
          </p>

          <form onSubmit={handleCreate} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="token-name"
                className="block text-xs font-medium text-slate-300"
              >
                Token Name
              </label>
              <input
                id="token-name"
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="e.g. My Laptop CLI"
                className="mt-1 block w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isCreating || !tokenName.trim()}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {isCreating ? "Generating..." : "Generate Token"}
            </button>
          </form>
        </div>

        {/* Tokens List */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 md:col-span-2">
          <h2 className="text-base font-semibold text-white">Active Tokens</h2>
          <p className="mt-1 text-xs text-slate-400">
            Tokens currently authorized to interact with your presentations.
          </p>

          {tokens.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
              No active API tokens found. Generate one or sign in with{" "}
              <code className="text-indigo-400">slides login</code>.
            </div>
          ) : (
            <div className="mt-4 divide-y divide-white/5">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <div className="font-medium text-white">{token.name}</div>
                    <div className="mt-0.5 font-mono text-xs text-slate-400">
                      {token.tokenMasked}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      Created on{" "}
                      {new Date(token.createdAt).toLocaleDateString()}
                      {token.lastUsedAt &&
                        ` · Last used ${new Date(token.lastUsedAt).toLocaleDateString()}`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevoke(token.id)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
