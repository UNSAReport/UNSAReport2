export type {
  AccessTokenClaims,
  AuthUser,
  Role,
  UserPayload,
} from '@unsa/schemas/auth';

export interface OAuthUserInfo {
  providerId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface OAuthProvider {
  name: string;
  getAuthUrl: (state: string, codeVerifier?: string) => string;
  exchangeCode: (code: string, codeVerifier?: string) => Promise<OAuthUserInfo>;
}
