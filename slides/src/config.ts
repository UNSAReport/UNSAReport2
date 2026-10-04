import { MAX_ARCHIVE_BYTES, PRESIGN_SECONDS } from '@unsa/schemas/constants';

function parseIntOrThrow(value: string, name: string): number {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) {
    throw new Error(`${name} must be an integer, got ${JSON.stringify(value)}`);
  }
  return n;
}

const idpIssuer = process.env.IDP_ISSUER || 'https://auth.unsareport.org';
const s3Endpoint = process.env.S3_ENDPOINT || 'http://localhost:8333';

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://slides:slidespassword@localhost:5434/slides_db',
  idpIssuer,
  audience: process.env.IDP_AUDIENCE || idpIssuer,
  idpJwksUrl: process.env.IDP_JWKS_URL || `${idpIssuer}/.well-known/jwks.json`,
  idpMeUrl: `${idpIssuer}/v1/me`,
  idpTimeoutMs: parseIntOrThrow(
    process.env.IDP_TIMEOUT_MS || '2000',
    'IDP_TIMEOUT_MS',
  ),
  baseUrl: process.env.BASE_URL || 'http://localhost:9876',
  port: parseIntOrThrow(process.env.PORT || '3002', 'PORT'),
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:9876'
  ).split(','),
  presignSeconds: parseIntOrThrow(
    process.env.PRESIGN_SECONDS || String(PRESIGN_SECONDS),
    'PRESIGN_SECONDS',
  ),
  maxArchiveBytes: parseIntOrThrow(
    process.env.MAX_ARCHIVE_BYTES || String(MAX_ARCHIVE_BYTES),
    'MAX_ARCHIVE_BYTES',
  ),
  s3: {
    endpoint: s3Endpoint,
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT || s3Endpoint,
    bucket: process.env.S3_BUCKET || 'unsareport-slides',
    accessKey: process.env.S3_ACCESS_KEY || 'seaweedadmin',
    secretKey: process.env.S3_SECRET_KEY || 'seaweedadmin',
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  },
};
