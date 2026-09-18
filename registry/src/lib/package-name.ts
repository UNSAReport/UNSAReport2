/**
 * Shared scoped-package route helpers.
 *
 * Canonical names are either an unscoped URL-safe part (`cardo`, `my.pkg`)
 * or a scoped `@scope/name` pair. Hono cannot match a `/` inside a single
 * `:param{regex}` on multi-segment routes, so every name-bearing route is
 * registered twice: once with `:name` (unscoped) and once with
 * `:scope/:name` (scoped). Handlers resolve both via {@link requestPackageName}.
 */

/** One URL-safe lowercase name part: `[a-z0-9._~-]` (alnum start). */
export const PACKAGE_NAME_PART = '[a-z0-9][a-z0-9._~-]*';
/** Scope segment including the leading `@`. */
export const PACKAGE_SCOPE_PART = '@[a-z0-9][a-z0-9._~-]*';

/** Unscoped single-segment name param, plus an optional route suffix. */
export function unscopedNameRoute(prefix: string, suffix = ''): string {
  return `${prefix}/:name{${PACKAGE_NAME_PART}}${suffix}`;
}

/** Scoped two-segment name param (`:scope/:name`), plus an optional suffix. */
export function scopedNameRoute(prefix: string, suffix = ''): string {
  return `${prefix}/:scope{${PACKAGE_SCOPE_PART}}/:name{${PACKAGE_NAME_PART}}${suffix}`;
}

/**
 * Resolves the full (possibly scoped) package name from matched route params,
 * lowercased like every registry `:name` read.
 */
export function requestPackageName(
  params: Record<string, string | undefined>,
): string {
  const scope = params.scope;
  const name = params.name ?? '';
  return ((scope ? `${scope}/` : '') + name).toLowerCase();
}
