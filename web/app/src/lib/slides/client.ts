import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { serverEnv } from '@/lib/env';

export const SLIDES_URL_FALLBACK = 'http://localhost:9876/api/slides';

export interface SlidesDeployInput {
  slug: string;
  title: string;
  description?: string;
  orgSlug?: string;
  visibility?: 'private' | 'org' | 'public' | 'unlisted';
  manifest: Record<string, unknown>;
  bundle: string;
}

export interface SlidesDeployResult {
  success: boolean;
  presentationId: string;
  slug: string;
  version: number;
  url: string;
  message: string;
}

export interface SlidesPresentation {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  ownerType: 'user' | 'organization';
  ownerId: string;
  visibility: 'private' | 'org' | 'public' | 'unlisted';
  activeVersion: number;
  thumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SlidesPresentationVersion {
  id: string;
  presentationId: string;
  versionNumber: number;
  entrypointUrl: string;
  manifest: Record<string, string>;
  deployedBy: string;
  deployedAt: string;
}

export interface SlidesOrganization {
  id: string;
  slug: string;
  name: string;
  role?: string;
}

function slidesBaseUrl(): string {
  return (serverEnv.SLIDES_URL || SLIDES_URL_FALLBACK).replace(/\/$/, '');
}

async function slidesFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getCookie('access_token');
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${slidesBaseUrl()}${path}`, { ...init, headers });
}
async function readErrorBody(res: Response): Promise<string> {
  let text = '';
  try {
    text = (await res.text()).trim();
  } catch {
    return '';
  }
  if (!text) return '';
  const clipped = text.length > 500 ? `${text.slice(0, 500)}…` : text;
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    return clipped;
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if (
      'message' in parsed &&
      typeof parsed.message === 'string' &&
      parsed.message.trim()
    ) {
      return parsed.message;
    }
    if (
      'error' in parsed &&
      typeof parsed.error === 'string' &&
      parsed.error.trim()
    ) {
      return parsed.error;
    }
  }
  return clipped;
}

function slidesError(action: string, res: Response, body: string): Error {
  const detail = body ? `: ${body}` : '';
  return new Error(`${action} (status ${res.status})${detail}`);
}

async function deployPresentationInternal(
  input: SlidesDeployInput,
): Promise<SlidesDeployResult> {
  const res = await slidesFetch('/presentations/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw slidesError(
      'Failed to deploy presentation',
      res,
      await readErrorBody(res),
    );
  }
  return (await res.json()) as SlidesDeployResult;
}

async function listPresentationsInternal(): Promise<SlidesPresentation[]> {
  const res = await slidesFetch('/presentations');
  if (!res.ok) {
    if (res.status === 404) return [];
    throw slidesError(
      'Failed to fetch presentations',
      res,
      await readErrorBody(res),
    );
  }
  const data = (await res.json()) as
    | { presentations: SlidesPresentation[] }
    | SlidesPresentation[];
  if (Array.isArray(data)) return data;
  return data.presentations ?? [];
}

async function getPresentationInternal(id: string): Promise<{
  presentation: SlidesPresentation;
  versions: SlidesPresentationVersion[];
}> {
  const res = await slidesFetch(`/presentations/${encodeURIComponent(id)}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw slidesError(
        `Presentation not found: ${id}`,
        res,
        await readErrorBody(res),
      );
    }
    throw slidesError(
      `Failed to fetch presentation: ${id}`,
      res,
      await readErrorBody(res),
    );
  }
  return (await res.json()) as {
    presentation: SlidesPresentation;
    versions: SlidesPresentationVersion[];
  };
}

async function listOrganizationsInternal(): Promise<SlidesOrganization[]> {
  const res = await slidesFetch('/orgs');
  if (!res.ok) {
    if (res.status === 404) return [];
    throw slidesError(
      'Failed to fetch organizations',
      res,
      await readErrorBody(res),
    );
  }
  const data = (await res.json()) as
    | { organizations: SlidesOrganization[] }
    | SlidesOrganization[];
  if (Array.isArray(data)) return data;
  return data.organizations ?? [];
}

export const deployPresentationServerFn = createServerFn({ method: 'POST' })
  .validator((data: SlidesDeployInput) => data)
  .handler(async ({ data }) => deployPresentationInternal(data));

export const listPresentationsServerFn = createServerFn({ method: 'GET' })
  .validator((data: Record<string, never> = {}) => data)
  .handler(async () => listPresentationsInternal());

export const getPresentationServerFn = createServerFn({ method: 'GET' })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => getPresentationInternal(data.id));

// The auth session cookie is HttpOnly (invisible to document.cookie), so
// the viewer asks the server for the raw session token to append as
// ?token= on the sandboxed iframe. Same-session passthrough, no elevation:
// the token returned is exactly the caller's own session token.
export const getEmbedTokenServerFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ token: string | null }> => {
    const token = getCookie('access_token');
    return { token: token ?? null };
  },
);

export const listOrganizationsServerFn = createServerFn({ method: 'GET' })
  .validator((data: Record<string, never> = {}) => data)
  .handler(async () => listOrganizationsInternal());
