export type FetchOptions = RequestInit & { token?: string };

export async function authFetch(
  baseUrl: string,
  path: string,
  opts: FetchOptions = {},
): Promise<Response> {
  const headers = new Headers(opts.headers);
  if (opts.token) {
    headers.set("Authorization", `Bearer ${opts.token}`);
  }
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, { ...opts, headers });
  return res;
}

export async function registryFetch(
  baseUrl: string,
  path: string,
  opts: FetchOptions = {},
): Promise<Response> {
  const headers = new Headers(opts.headers);
  if (opts.token) {
    headers.set("Authorization", `Bearer ${opts.token}`);
  }
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  return fetch(url, { ...opts, headers });
}

function extractMessage(json: unknown, fallback: string): string {
  if (
    json !== null &&
    typeof json === "object" &&
    "message" in json &&
    typeof json.message === "string"
  ) {
    return json.message;
  }
  return fallback;
}

export async function handleAuthResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
    const message = extractMessage(json, text);
    throw new Error(message || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}
