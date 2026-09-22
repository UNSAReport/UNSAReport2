import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { serverEnv } from '@/lib/env';

export interface RegistryPackage {
  name: string;
  displayName?: string | null;
  description?: string | null;
  tags?: string[];
  latestVersion?: string | null;
}

export interface RegistryVersionRow {
  id: string;
  version: string;
  status: string;
  fileCount: number;
  createdAt: string;
  approvedAt?: string | null;
}

export interface RegistryVersionDetail {
  package: string;
  displayName?: string | null;
  description?: string | null;
  authorId?: string;
  version: string;
  status: string;
  rejectionReason?: string | null;
  fileCount: number;
  createdAt: string;
  approvedAt?: string | null;
  files: Array<{
    path: string;
    section: string;
    size: number;
    checksum: string;
  }>;
  dependencies: Record<string, string>;
}

async function registryFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = serverEnv.REGISTRY_URL.replace(/\/$/, '');
  const token = getCookie('access_token');
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${base}${path}`, { ...init, headers });
}

function encodePackageName(name: string): string {
  return name.split('/').map(encodeURIComponent).join('/');
}

async function fetchPackagesInternal(opts?: {
  search?: string;
  tag?: string;
}): Promise<RegistryPackage[]> {
  const params = new URLSearchParams();
  if (opts?.search) {
    params.set('q', opts.search);
    params.set('search', opts.search);
  }
  if (opts?.tag) params.set('tag', opts.tag);
  const qs = params.toString() ? `?${params}` : '';
  const res = await registryFetch(`/v1/packages${qs}`);
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Failed to fetch packages: ${res.status}`);
  }
  const data = (await res.json()) as
    | { packages: RegistryPackage[] }
    | RegistryPackage[];
  if (Array.isArray(data)) return data;
  return data.packages ?? [];
}
async function fetchPackageInternal(
  name: string,
): Promise<RegistryPackage & { versions?: string[] }> {
  const res = await registryFetch(`/v1/packages/${encodePackageName(name)}`);
  if (!res.ok) throw new Error(`Package not found: ${name}`);
  return (await res.json()) as RegistryPackage & {
    versions?: string[];
  };
}

async function fetchVersionsInternal(
  name: string,
): Promise<RegistryVersionRow[]> {
  const res = await registryFetch(
    `/v1/packages/${encodePackageName(name)}/versions`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as
    | { versions: RegistryVersionRow[] }
    | RegistryVersionRow[];
  if (Array.isArray(data)) return data;
  return data.versions ?? [];
}

async function fetchVersionInternal(
  name: string,
  version: string,
): Promise<RegistryVersionDetail> {
  const res = await registryFetch(
    `/v1/packages/${encodePackageName(name)}/${encodeURIComponent(version)}`,
  );
  if (!res.ok) throw new Error(`Version not found: ${name}@${version}`);
  return (await res.json()) as RegistryVersionDetail;
}

export const fetchPackagesServerFn = createServerFn({ method: 'GET' })
  .validator((data: { search?: string; tag?: string } = {}) => data)
  .handler(async ({ data }) => fetchPackagesInternal(data));

export const fetchPackageServerFn = createServerFn({ method: 'GET' })
  .validator((data: { name: string }) => data)
  .handler(async ({ data }) => fetchPackageInternal(data.name));

export const fetchVersionsServerFn = createServerFn({ method: 'GET' })
  .validator((data: { name: string }) => data)
  .handler(async ({ data }) => fetchVersionsInternal(data.name));

export const fetchVersionServerFn = createServerFn({ method: 'GET' })
  .validator((data: { name: string; version: string }) => data)
  .handler(async ({ data }) => fetchVersionInternal(data.name, data.version));
