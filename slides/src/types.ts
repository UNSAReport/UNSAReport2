import type {
  CliDeployRequest,
  CliDeployResponse,
} from '@unsa/schemas/cli-api';
import type { Organization, OrgMember } from '@unsa/schemas/orgs';
import type {
  Presentation,
  PresentationVersion,
} from '@unsa/schemas/presentations';

export type {
  CliDeployRequest,
  CliDeployResponse,
  Organization,
  OrgMember,
  Presentation,
  PresentationVersion,
};

/**
 * Authenticated slides user resolved from an IdP JWT (via JWKS) or an IdP
 * PAT (validated against the IdP userinfo endpoint). Roles mirror the IdP
 * `user_roles` map keyed by sub-app; the slides service only reads
 * `roles['slides']` and never writes IdP roles.
 */
export interface SlidesUser {
  id: string;
  email?: string;
  name?: string;
  roles: Record<string, string>;
}

/**
 * Environment type configuration for Hono application context variables.
 */
export type HonoEnv = {
  Variables: {
    user?: SlidesUser;
  };
};
