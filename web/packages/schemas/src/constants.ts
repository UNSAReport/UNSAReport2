export const PAT_PREFIX = 'unsareport_pat_';
export const ACCESS_TOKEN_TTL_S = 900;
export const REFRESH_TOKEN_TTL_S = 2592000;
export const DEFAULT_PACKAGES_LIMIT = 100;
export const JWKS_CACHE_SECONDS = 3600;
export const STATE_COOKIE_SECONDS = 600;
export const MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;
export const PRESIGN_SECONDS = 600;

export const SUBAPP_REGISTRY = 'registry' as const;
export const SUBAPP_SLIDES = 'slides' as const;
export const DEFAULT_SUB_APPS = [SUBAPP_REGISTRY, SUBAPP_SLIDES] as const;
export const DEFAULT_USER_ROLE = 'user' as const;

