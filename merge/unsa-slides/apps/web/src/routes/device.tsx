import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { fetchCurrentUser } from "@/lib/auth-server";
import {
  authorizeDeviceServerFn,
  getDeviceCodeInfoServerFn,
} from "@/lib/cli-auth-server";

const deviceSearchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/device")({
  validateSearch: (search) => deviceSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const user = await fetchCurrentUser();
    const initialCode = deps.code || "";
    let codeInfo = null;

    if (initialCode) {
      codeInfo = await getDeviceCodeInfoServerFn({
        data: { userCode: initialCode },
      });
    }

    return { user, initialCode, codeInfo };
  },
  component: DeviceAuthPage,
});

function DeviceAuthPage() {
  const { user, initialCode } = Route.useLoaderData();
  const [code, setCode] = useState(initialCode);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length < 4) {
      setStatus("error");
      setMessage("Please enter a valid authorization code.");
      return;
    }

    setStatus("loading");
    try {
      const res = await authorizeDeviceServerFn({
        data: { userCode: code.trim() },
      });
      if (res.success) {
        setStatus("success");
        setMessage(res.message);
      } else {
        setStatus("error");
        setMessage(res.message);
      }
    } catch (_err: unknown) {
      setStatus("error");
      setMessage("Failed to authorize device. Please try again.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500/30">
            <svg
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Terminal Device Icon"
            >
              <title>Terminal Icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Authorize CLI</h1>
          <p className="mt-1 text-sm text-slate-400">
            Connect your local terminal to UNSA Slides Cloud
          </p>
        </div>

        {!user ? (
          <div className="space-y-4 text-center">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
              You need to sign in to your account before authorizing the CLI.
            </div>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500"
            >
              Sign in with Google
            </Link>
          </div>
        ) : status === "success" ? (
          <div className="space-y-6 text-center">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  role="img"
                  aria-label="Success Icon"
                >
                  <title>Checkmark Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">
                Authorization Successful!
              </h3>
              <p className="mt-1 text-xs text-slate-300">
                Your CLI is now authenticated as{" "}
                <span className="font-semibold text-white">{user.name}</span>.
              </p>
            </div>
            <p className="text-xs text-slate-400">
              You can close this tab and return to your terminal.
            </p>
            <Link
              to="/"
              className="inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              ← Back to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleAuthorize} className="space-y-5">
            <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-xs text-slate-300">
              Authorizing as:{" "}
              <span className="font-semibold text-white">{user.name}</span> (
              {user.email})
            </div>

            <div>
              <label
                htmlFor="user-code-input"
                className="block text-xs font-medium uppercase tracking-wider text-slate-400"
              >
                Enter Code from Terminal
              </label>
              <input
                id="user-code-input"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABCD-1234"
                maxLength={9}
                className="mt-2 block w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-center font-mono text-xl font-bold tracking-widest text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            {status === "error" && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-400">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading" || !code}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {status === "loading" ? "Authorizing..." : "Authorize CLI"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
