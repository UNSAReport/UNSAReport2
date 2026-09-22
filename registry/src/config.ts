import {
  DEFAULT_PACKAGES_LIMIT,
  MAX_ARCHIVE_BYTES,
  PRESIGN_SECONDS,
} from '@unsa/schemas/constants';

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

const s3Endpoint = requiredEnv('S3_ENDPOINT');

export const config = {
  databaseUrl: requiredEnv('DATABASE_URL'),
  idpIssuer: process.env.IDP_ISSUER || 'https://auth.unsareport.org',
  idpJwksUrl:
    process.env.IDP_JWKS_URL ||
    `${process.env.IDP_ISSUER || 'https://auth.unsareport.org'}/.well-known/jwks.json`,
  idpTimeoutMs: parseIntOrThrow(
    process.env.IDP_TIMEOUT_MS || '2000',
    'IDP_TIMEOUT_MS',
  ),
  port: parseIntOrThrow(process.env.PORT || '3001', 'PORT'),
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || 'http://localhost:5173'
  ).split(','),
  packagesLimit: parseIntOrThrow(
    process.env.PACKAGES_LIMIT || String(DEFAULT_PACKAGES_LIMIT),
    'PACKAGES_LIMIT',
  ),
  presignSeconds: parseIntOrThrow(
    process.env.PRESIGN_SECONDS || String(PRESIGN_SECONDS),
    'PRESIGN_SECONDS',
  ),
  s3: {
    endpoint: s3Endpoint,
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT || s3Endpoint,
    bucket: requiredEnv('S3_BUCKET'),
    accessKey: requiredEnv('S3_ACCESS_KEY'),
    secretKey: requiredEnv('S3_SECRET_KEY'),
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  },
  maxPendingPackages: parseIntOrThrow(
    process.env.MAX_PENDING_PACKAGES || '5',
    'MAX_PENDING_PACKAGES',
  ),
  maxArchiveBytes: parseIntOrThrow(
    process.env.MAX_ARCHIVE_BYTES || String(MAX_ARCHIVE_BYTES),
    'MAX_ARCHIVE_BYTES',
  ),
};
