export const config = {
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://registry:registrypassword@localhost:5433/registry_db',
  idpIssuer: process.env.IDP_ISSUER || 'https://auth.unsareport.org',
  idpJwksUrl:
    process.env.IDP_JWKS_URL ||
    `${process.env.IDP_ISSUER || 'https://auth.unsareport.org'}/.well-known/jwks.json`,
  port: Number.parseInt(process.env.PORT || '3001', 10),
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || 'http://localhost:5173'
  ).split(','),
  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://localhost:8333',
    publicEndpoint:
      process.env.S3_PUBLIC_ENDPOINT ||
      process.env.S3_ENDPOINT ||
      'http://localhost:8333',
    bucket: process.env.S3_BUCKET || 'unsareport-registry',
    accessKey: process.env.S3_ACCESS_KEY || 'seaweedadmin',
    secretKey: process.env.S3_SECRET_KEY || 'seaweedadmin',
    region: process.env.S3_REGION || 'us-east-1',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
  },
  maxPendingPackages: Number.parseInt(
    process.env.MAX_PENDING_PACKAGES || '5',
    10,
  ),
};
