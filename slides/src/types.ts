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

export interface SlidesUser {
  id: string;
  email?: string;
  name?: string;
  roles: Record<string, string>;
}

export type HonoEnv = {
  Variables: {
    user?: SlidesUser;
  };
};
