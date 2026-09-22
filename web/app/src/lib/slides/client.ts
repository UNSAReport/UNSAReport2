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

async function deployPresentationInternal(
  input: SlidesDeployInput,
): Promise<SlidesDeployResult> {
  const res = await slidesFetch('/presentations/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`Failed to deploy presentation: ${res.status}`);
  return (await res.json()) as SlidesDeployResult;
}

async function listPresentationsInternal(): Promise<SlidesPresentation[]> {
  const res = await slidesFetch('/presentations');
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to fetch presentations: ${res.status}`);
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
  if (!res.ok) throw new Error(`Presentation not found: ${id}`);
  return (await res.json()) as {
    presentation: SlidesPresentation;
    versions: SlidesPresentationVersion[];
  };
}

async function listOrganizationsInternal(): Promise<SlidesOrganization[]> {
  const res = await slidesFetch('/orgs');
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to fetch organizations: ${res.status}`);
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

export const listOrganizationsServerFn = createServerFn({ method: 'GET' })
  .validator((data: Record<string, never> = {}) => data)
  .handler(async () => listOrganizationsInternal());
