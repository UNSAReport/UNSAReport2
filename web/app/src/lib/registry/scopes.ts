import { createServerFn } from '@tanstack/react-start';
import { getCookie } from '@tanstack/react-start/server';
import type {
  ScopeDetail,
  ScopeFile,
  ScopeInvitationItem,
  ScopeItem,
  ScopeMemberRole,
} from '@unsa/schemas/registry';
import { COOKIE_ACCESS_TOKEN } from '@/lib/auth/server';
import { serverEnv } from '@/lib/env';

export const SCOPES_ENDPOINT = '/v1/scopes';
export const SCOPES_REQUESTS_ENDPOINT = '/v1/scopes/requests';
export const SCOPES_INVITATIONS_ENDPOINT = '/v1/scopes/invitations';

export const ROLE_ADMIN: ScopeMemberRole = 'admin';
export const ROLE_CONTRIBUTOR: ScopeMemberRole = 'contributor';

export const MIN_SCOPE_REASON_LENGTH = 5;

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

async function scopeFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  if (!token) {
    throw new Error('Unauthorized: Authentication required');
  }

  const base = serverEnv.REGISTRY_URL.replace(/\/+$/, '');
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

function encodeScopeName(scope: string): string {
  return encodeURIComponent(scope.trim());
}

export const fetchUserScopesServerFn = createServerFn({
  method: 'GET',
}).handler(async (): Promise<ScopeItem[]> => {
  const res = await scopeFetch(SCOPES_ENDPOINT);
  const data = (await res.json()) as { scopes?: ScopeItem[] };
  return data.scopes ?? [];
});

export const fetchScopeDetailServerFn = createServerFn({
  method: 'GET',
})
  .validator((data: { scope: string }) => data)
  .handler(async ({ data }): Promise<ScopeDetail> => {
    const endpoint = `${SCOPES_ENDPOINT}/${encodeScopeName(data.scope)}`;
    const res = await scopeFetch(endpoint);
    const result = (await res.json()) as { scope: ScopeDetail };
    return result.scope;
  });

export const fetchScopeFilesServerFn = createServerFn({
  method: 'GET',
})
  .validator((data: { scope: string }) => data)
  .handler(async ({ data }): Promise<ScopeFile[]> => {
    const endpoint = `${SCOPES_ENDPOINT}/${encodeScopeName(data.scope)}/files`;
    const res = await scopeFetch(endpoint);
    const result = (await res.json()) as { files?: ScopeFile[] };
    return result.files ?? [];
  });

export const fetchScopeArchiveDownloadUrlServerFn = createServerFn({
  method: 'GET',
})
  .validator((data: { scope: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{ downloadUrl: string; archiveS3Key: string }> => {
      const endpoint = `${SCOPES_ENDPOINT}/${encodeScopeName(data.scope)}/archive`;
      const res = await scopeFetch(endpoint);
      return (await res.json()) as {
        downloadUrl: string;
        archiveS3Key: string;
      };
    },
  );

export const requestCustomScopeServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { scopeName: string; reason: string }) => data)
  .handler(
    async ({
      data,
    }): Promise<{
      message: string;
      request: { id: string; scopeName: string; status: string };
    }> => {
      const res = await scopeFetch(SCOPES_REQUESTS_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({
          scopeName: data.scopeName.trim(),
          reason: data.reason.trim(),
        }),
      });
      return (await res.json()) as {
        message: string;
        request: { id: string; scopeName: string; status: string };
      };
    },
  );

export const listUserInvitationsServerFn = createServerFn({
  method: 'GET',
}).handler(async (): Promise<ScopeInvitationItem[]> => {
  const res = await scopeFetch(SCOPES_INVITATIONS_ENDPOINT);
  const data = (await res.json()) as { invitations?: ScopeInvitationItem[] };
  return data.invitations ?? [];
});

export const listScopeInvitationsServerFn = createServerFn({
  method: 'GET',
})
  .validator((data: { scope: string }) => data)
  .handler(async ({ data }): Promise<ScopeInvitationItem[]> => {
    const endpoint = `${SCOPES_ENDPOINT}/${encodeScopeName(data.scope)}/invitations`;
    const res = await scopeFetch(endpoint);
    const json = (await res.json()) as {
      invitations?: ScopeInvitationItem[];
    };
    return json.invitations ?? [];
  });

export const inviteScopeMemberServerFn = createServerFn({
  method: 'POST',
})
  .validator(
    (data: { scope: string; email: string; role: ScopeMemberRole }) => data,
  )
  .handler(
    async ({
      data,
    }): Promise<{
      message: string;
      invitation: { id: string; email: string; role: string; status: string };
    }> => {
      const endpoint = `${SCOPES_ENDPOINT}/${encodeScopeName(data.scope)}/invitations`;
      const res = await scopeFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          email: data.email.trim().toLowerCase(),
          role: data.role,
        }),
      });
      return (await res.json()) as {
        message: string;
        invitation: { id: string; email: string; role: string; status: string };
      };
    },
  );

export const cancelScopeInvitationServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { scope: string; invitationId: string }) => data)
  .handler(async ({ data }): Promise<{ message: string }> => {
    const endpoint = `${SCOPES_ENDPOINT}/${encodeScopeName(data.scope)}/invitations/${encodeURIComponent(data.invitationId.trim())}`;
    const res = await scopeFetch(endpoint, { method: 'DELETE' });
    return (await res.json()) as { message: string };
  });

export const acceptScopeInvitationServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { invitationId: string }) => data)
  .handler(
    async ({ data }): Promise<{ message: string; role: ScopeMemberRole }> => {
      const endpoint = `${SCOPES_INVITATIONS_ENDPOINT}/${encodeURIComponent(data.invitationId.trim())}/accept`;
      const res = await scopeFetch(endpoint, { method: 'POST' });
      return (await res.json()) as {
        message: string;
        role: ScopeMemberRole;
      };
    },
  );

export const declineScopeInvitationServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { invitationId: string }) => data)
  .handler(async ({ data }): Promise<{ message: string }> => {
    const endpoint = `${SCOPES_INVITATIONS_ENDPOINT}/${encodeURIComponent(data.invitationId.trim())}/decline`;
    const res = await scopeFetch(endpoint, { method: 'POST' });
    return (await res.json()) as { message: string };
  });

export const updateScopeMemberRoleServerFn = createServerFn({
  method: 'POST',
})
  .validator(
    (data: { scope: string; userId: string; role: ScopeMemberRole }) => data,
  )
  .handler(
    async ({ data }): Promise<{ message: string; role: ScopeMemberRole }> => {
      const endpoint = `${SCOPES_ENDPOINT}/${encodeScopeName(data.scope)}/members/${encodeURIComponent(data.userId.trim())}`;
      const res = await scopeFetch(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ role: data.role }),
      });
      return (await res.json()) as {
        message: string;
        role: ScopeMemberRole;
      };
    },
  );

export const removeScopeMemberServerFn = createServerFn({
  method: 'POST',
})
  .validator((data: { scope: string; userId: string }) => data)
  .handler(async ({ data }): Promise<{ message: string }> => {
    const endpoint = `${SCOPES_ENDPOINT}/${encodeScopeName(data.scope)}/members/${encodeURIComponent(data.userId.trim())}`;
    const res = await scopeFetch(endpoint, { method: 'DELETE' });
    return (await res.json()) as { message: string };
  });
