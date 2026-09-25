function parseIntOrThrow(value: string, name: string): number {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) {
    throw new Error(`${name} must be an integer, got ${JSON.stringify(value)}`);
  }
  return n;
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
  idpIssuer,
  idpJwksUrl: process.env.IDP_JWKS_URL || `${idpIssuer}/.well-known/jwks.json`,
  idpMeUrl: `${idpIssuer}/v1/me`,
  idpTimeoutMs: parseIntOrThrow(
    process.env.IDP_TIMEOUT_MS || '2000',
    'IDP_TIMEOUT_MS',
  ),
  baseUrl: process.env.BASE_URL || 'http://localhost:9876',
  port: parseIntOrThrow(process.env.PORT || '3002', 'PORT'),
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || 'http://localhost:5173'
  ).split(','),
};
