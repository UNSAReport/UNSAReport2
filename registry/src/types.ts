import type {
  ApiErrorResponse,
  JWTPayload,
  PkgToml,
  ResolvedPackage,
  UserContext,
} from '@unsa/schemas/registry';

export type {
  ApiErrorResponse,
  JWTPayload,
  PkgToml,
  ResolvedPackage,
  UserContext,
};

/**
 * Request payload for resolving package dependencies.
 */
export interface DependencyResolveRequest {
  packages: Record<string, string>;
}

/**
 * Response payload containing the list of resolved packages.
 */
export interface DependencyResolveResponse {
  resolved: ResolvedPackage[];
}

/**
 * Environment type configuration for Hono application context variables.
 */
export type HonoEnv = {
  Variables: {
    user?: UserContext;
  };
};
