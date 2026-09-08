export type {
  AccessTokenClaims,
  AuthUser,
  Role,
  UserPayload,
} from '@unsa/schemas/auth';

/**
 * Represents standard user profile metadata returned by an OAuth provider.
 */
export interface OAuthUserInfo {
  providerId: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Interface contract defining methods required for an OAuth authentication provider.
 */
export interface OAuthProvider {
  name: string;
  getAuthUrl: (state: string, codeVerifier?: string) => string;
  exchangeCode: (code: string, codeVerifier?: string) => Promise<OAuthUserInfo>;
}
