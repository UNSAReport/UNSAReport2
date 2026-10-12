import process from 'node:process';
import {
  ACCESS_TOKEN_TTL_S,
  DEFAULT_SUB_APPS,
  DEFAULT_USER_ROLE,
  REFRESH_TOKEN_TTL_S,
} from '@unsa/schemas/constants';
import type { Role } from '@/types';

function parseIntOrThrow(raw: string, name: string): number {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }
  return parsed;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const idpIssuer = process.env.IDP_ISSUER || 'https://auth.unsareport.org';
export const config = {
  databaseUrl: requiredEnv('DATABASE_URL'),

  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',

  idpIssuer,
  idpJwksUrl: process.env.IDP_JWKS_URL || `${idpIssuer}/.well-known/jwks.json`,
  idpPort: parseIntOrThrow(process.env.IDP_PORT || '3000', 'IDP_PORT'),
  idpAllowedOrigins: (
    process.env.IDP_ALLOWED_ORIGINS ||
    'http://localhost:5173,https://slides.unsareport.org'
  )
    .split(',')
    .map((o) => o.trim()),

  accessTokenTtl: parseIntOrThrow(
    process.env.ACCESS_TOKEN_TTL || String(ACCESS_TOKEN_TTL_S),
    'ACCESS_TOKEN_TTL',
  ),
  refreshTokenTtl: parseIntOrThrow(
    process.env.REFRESH_TOKEN_TTL || String(REFRESH_TOKEN_TTL_S),
    'REFRESH_TOKEN_TTL',
  ),

  clientRedirectUrl: process.env.CLIENT_REDIRECT_URL || 'http://localhost:5173',
  adminApiKey: requiredEnv('ADMIN_API_KEY'),

  defaultSubApps: process.env.DEFAULT_SUB_APPS
    ? process.env.DEFAULT_SUB_APPS.split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [...DEFAULT_SUB_APPS],
  defaultRole: (process.env.DEFAULT_ROLE || DEFAULT_USER_ROLE) as Role,
};
