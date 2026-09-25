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

export interface DependencyResolveRequest {
  packages: Record<string, string>;
}

export interface DependencyResolveResponse {
  resolved: ResolvedPackage[];
}

export type HonoEnv = {
  Variables: {
    user?: UserContext;
  };
};
