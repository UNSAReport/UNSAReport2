import { z } from "zod";

const serverEnvSchema = z.object({
  IDP_ISSUER: z.string().url().default("https://auth.unsareport.org"),
  IDP_JWKS_URL: z.string().url().optional(),
  REGISTRY_URL: z.string().url().default("http://localhost:3001"),
  BASE_URL: z.string().url().default("http://localhost:3000"),
  CLIENT_REDIRECT_URL: z.string().url().default("http://localhost:3000"),
  PORT: z.coerce.number().default(3000),
});

const clientEnvSchema = z.object({
  BASE_URL: z.string().url().default("http://localhost:3000"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

function getServerEnv(): ServerEnv {
  const raw = {
    IDP_ISSUER: process.env.IDP_ISSUER,
    IDP_JWKS_URL: process.env.IDP_JWKS_URL,
    REGISTRY_URL: process.env.REGISTRY_URL,
    BASE_URL: process.env.BASE_URL,
    CLIENT_REDIRECT_URL: process.env.CLIENT_REDIRECT_URL,
    PORT: process.env.PORT,
  };
  const parsed = serverEnvSchema.safeParse(raw);
  if (!parsed.success) {
    // allow missing env in dev — use defaults
    return serverEnvSchema.parse({});
  }
  const env = parsed.data;
  // derive JWKS url if not set
  if (!env.IDP_JWKS_URL) {
    env.IDP_JWKS_URL = `${env.IDP_ISSUER.replace(/\/$/, "")}/.well-known/jwks.json`;
  }
  return env;
}

export const serverEnv: ServerEnv = getServerEnv();

export const clientEnv: ClientEnv = clientEnvSchema.parse({
  BASE_URL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.BASE_URL || "http://localhost:3000",
});
