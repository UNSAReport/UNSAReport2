import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import { COOKIE_ACCESS_TOKEN } from '@/lib/auth/server';
import { serverEnv } from '@/lib/env';

export const ADMIN_PENDING_ENDPOINT = '/v1/admin/pending';
export const ADMIN_PACKAGES_ENDPOINT = '/v1/admin/packages';
export const ADMIN_TRUSTED_ENDPOINT = '/v1/admin/trusted';
export const PACKAGES_ENDPOINT = '/v1/packages';
export const TAGS_ENDPOINT = '/v1/tags';
export const IDP_ROLES_ENDPOINT = '/v1/roles';
export const REGISTRY_SUBAPP_NAME = 'registry';
export const DEFAULT_PACKAGES_LIMIT = 100;
export const DEFAULT_PACKAGES_OFFSET = 0;

export interface PendingVersionItem {
  packageId: string;
  name: string;
  displayName: string | null;
  authorId: string;
  versionId: string;
  version: string;
  fileCount: number;
  createdAt: string;
}

export interface TrustedUserItem {
  userId: string;
  grantedBy: string;
  createdAt: string;
}

export interface AdminPackageItem {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  authorId: string;
  latestVersion: string | null;
  status: 'approved' | 'pending' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface TagItem {
  id: string;
  name: string;
  displayName: string;
  parentId: string | null;
  createdAt: string;
  children?: TagItem[];
}

export interface UserRoleItem {
  id: string;
  userId: string;
  subApp: string;
  role: 'admin' | 'user';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserWithRolesItem {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  createdAt: string;
  roles: UserRoleItem[];
}

async function extractErrorMessage(res: Response): Promise<string> {
  const fallbackMessage = `Request failed with status ${res.status}`;
  try {
    const json = (await res.json()) as {
      message?: string;
      error?: string;
    };
    if (typeof json?.message === 'string' && json.message.trim().length > 0) {
      return json.message;
    }
    if (typeof json?.error === 'string' && json.error.trim().length > 0) {
      return json.error;
    }
    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function registryAdminFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  if (!token) {
    throw new Error('Unauthorized: Authentication required');
  }

  const base = serverEnv.REGISTRY_URL.replace(/\/$/, '');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) {
    const message = await extractErrorMessage(res);
    throw new Error(message);
  }
  return res;
}

function encodePackageName(name: string): string {
  return name.split('/').map(encodeURIComponent).join('/');
}

async function authAdminFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  if (!token) {
    throw new Error('Unauthorized: Authentication required');
  }

  const base = serverEnv.IDP_ISSUER.replace(/\/$/, '');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) {
    const message = await extractErrorMessage(res);
    throw new Error(message);
  }
  return res;
}

// 1. Pending Moderation Queue
export const listPendingPackagesServerFn = createServerFn({
  method: 'GET',
}).handler(async (): Promise<PendingVersionItem[]> => {
  const res = await registryAdminFetch(ADMIN_PENDING_ENDPOINT);
  const data = (await res.json()) as { pending: PendingVersionItem[] };
  return data.pending ?? [];
});

export const approvePackageVersionServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { name: string; version: string }) => data)
  .handler(async ({ data }): Promise<{ message: string }> => {
    const endpoint = `${ADMIN_PACKAGES_ENDPOINT}/${encodePackageName(data.name.toLowerCase())}/${encodeURIComponent(data.version)}/approve`;
    const res = await registryAdminFetch(endpoint, { method: 'POST' });
    return (await res.json()) as { message: string };
  });

export const rejectPackageVersionServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { name: string; version: string; reason: string }) => data)
  .handler(async ({ data }): Promise<{ message: string; reason: string }> => {
    const endpoint = `${ADMIN_PACKAGES_ENDPOINT}/${encodePackageName(data.name.toLowerCase())}/${encodeURIComponent(data.version)}/reject`;
    const res = await registryAdminFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ reason: data.reason }),
    });
    return (await res.json()) as { message: string; reason: string };
  });

// 2. Trusted Publishers Management
export const listTrustedUsersServerFn = createServerFn({
  method: 'GET',
}).handler(async (): Promise<TrustedUserItem[]> => {
  const res = await registryAdminFetch(ADMIN_TRUSTED_ENDPOINT);
  const data = (await res.json()) as { trustedUsers: TrustedUserItem[] };
  return data.trustedUsers ?? [];
});

export const addTrustedUserServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }): Promise<TrustedUserItem> => {
    const res = await registryAdminFetch(ADMIN_TRUSTED_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ userId: data.userId.trim() }),
    });
    return (await res.json()) as TrustedUserItem;
  });

export const removeTrustedUserServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }): Promise<{ message: string }> => {
    const endpoint = `${ADMIN_TRUSTED_ENDPOINT}/${encodeURIComponent(data.userId.trim())}`;
    const res = await registryAdminFetch(endpoint, { method: 'DELETE' });
    return (await res.json()) as { message: string };
  });

// 3. Package Audit & Version Deletion
export const listAdminPackagesServerFn = createServerFn({
  method: 'GET',
})
  .validator((data: { status?: string } = {}) => data)
  .handler(async ({ data }): Promise<AdminPackageItem[]> => {
    const statusParam = data.status ? data.status.trim() : 'all';
    const endpoint = `${PACKAGES_ENDPOINT}?status=${encodeURIComponent(statusParam)}&limit=${DEFAULT_PACKAGES_LIMIT}&offset=${DEFAULT_PACKAGES_OFFSET}`;
    const res = await registryAdminFetch(endpoint);
    const result = (await res.json()) as { packages?: AdminPackageItem[] };
    return result.packages ?? [];
  });

export const deletePackageVersionServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { name: string; version: string }) => data)
  .handler(async ({ data }): Promise<{ message: string }> => {
    const endpoint = `${PACKAGES_ENDPOINT}/${encodePackageName(data.name.toLowerCase())}/${encodeURIComponent(data.version)}`;
    const res = await registryAdminFetch(endpoint, { method: 'DELETE' });
    return (await res.json()) as { message: string };
  });

// 4. Tag Taxonomy Management
export const listTagsServerFn = createServerFn({
  method: 'GET',
}).handler(async (): Promise<TagItem[]> => {
  const res = await registryAdminFetch(TAGS_ENDPOINT);
  const data = (await res.json()) as { tags?: TagItem[] };
  return data.tags ?? [];
});

export const createTagServerFn = createServerFn({
  method: 'POST',
})
  .validator(
    (data: { name: string; displayName: string; parentId?: string | null }) =>
      data,
  )
  .handler(async ({ data }): Promise<TagItem> => {
    const res = await registryAdminFetch(TAGS_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({
        name: data.name.trim().toLowerCase(),
        displayName: data.displayName.trim(),
        parentId: data.parentId ? data.parentId.trim() : null,
      }),
    });
    return (await res.json()) as TagItem;
  });

export const deleteTagServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<{ message: string }> => {
    const endpoint = `${TAGS_ENDPOINT}/${encodeURIComponent(data.id.trim())}`;
    const res = await registryAdminFetch(endpoint, { method: 'DELETE' });
    return (await res.json()) as { message: string };
  });

// 5. Auth IdP Role Management (Tester Impersonation)
export const listSubAppRolesServerFn = createServerFn({
  method: 'GET',
})
  .validator(
    (data: { subApp: string } = { subApp: REGISTRY_SUBAPP_NAME }) => data,
  )
  .handler(async ({ data }): Promise<UserRoleItem[]> => {
    const endpoint = `${IDP_ROLES_ENDPOINT}/${encodeURIComponent(data.subApp.trim())}`;
    const res = await authAdminFetch(endpoint);
    const json = (await res.json()) as { roles?: UserRoleItem[] };
    return json.roles ?? [];
  });

export const assignRoleServerFn = createServerFn({
  method: 'POST',
})
  .validator(
    (data: { userId: string; subApp: string; role: 'admin' | 'user' }) => data,
  )
  .handler(
    async ({ data }): Promise<{ success: boolean; role: UserRoleItem }> => {
      const res = await authAdminFetch(IDP_ROLES_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          userId: data.userId.trim(),
          subApp: data.subApp.trim(),
          role: data.role,
        }),
      });
      return (await res.json()) as { success: boolean; role: UserRoleItem };
    },
  );

export const revokeRoleServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { userId: string; subApp: string }) => data)
  .handler(async ({ data }): Promise<{ success: boolean; message: string }> => {
    const res = await authAdminFetch(IDP_ROLES_ENDPOINT, {
      method: 'DELETE',
      body: JSON.stringify({
        userId: data.userId.trim(),
        subApp: data.subApp.trim(),
      }),
    });
    return (await res.json()) as { success: boolean; message: string };
  });

export const searchUsersServerFn = createServerFn({
  method: 'GET',
})
  .validator((data: { query?: string } = {}) => data)
  .handler(async ({ data }): Promise<UserWithRolesItem[]> => {
    const qParam = data.query
      ? `?q=${encodeURIComponent(data.query.trim())}`
      : '';
    const endpoint = `${IDP_ROLES_ENDPOINT}/users${qParam}`;
    const res = await authAdminFetch(endpoint);
    const json = (await res.json()) as { users?: UserWithRolesItem[] };
    return json.users ?? [];
  });

export const getUserRolesServerFn = createServerFn({
  method: 'GET',
})
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }): Promise<UserRoleItem[]> => {
    const endpoint = `${IDP_ROLES_ENDPOINT}/user/${encodeURIComponent(data.userId.trim())}`;
    const res = await authAdminFetch(endpoint);
    const json = (await res.json()) as { roles?: UserRoleItem[] };
    return json.roles ?? [];
  });
