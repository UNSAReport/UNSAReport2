export const config = {
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://slides:slidespassword@localhost:5434/slides_db',
  idpIssuer: process.env.IDP_ISSUER || 'https://auth.unsareport.org',
  idpJwksUrl:
    process.env.IDP_JWKS_URL ||
    `${process.env.IDP_ISSUER || 'https://auth.unsareport.org'}/.well-known/jwks.json`,
  idpMeUrl: `${process.env.IDP_ISSUER || 'https://auth.unsareport.org'}/v1/me`,
  idpTimeoutMs: Number.parseInt(process.env.IDP_TIMEOUT_MS || '2000', 10),
  baseUrl: process.env.BASE_URL || 'http://localhost:9876',
  port: Number.parseInt(process.env.PORT || '3002', 10),
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || 'http://localhost:5173'
  ).split(','),
};
