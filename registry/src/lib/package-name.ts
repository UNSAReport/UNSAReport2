export const PACKAGE_NAME_PART = '[a-z0-9][a-z0-9._~-]*';
export const PACKAGE_SCOPE_PART = '(?:@|%40)[a-z0-9][a-z0-9._~-]*';

export function unscopedNameRoute(prefix: string, suffix = ''): string {
  return `${prefix}/:name{${PACKAGE_NAME_PART}}${suffix}`;
}

export function scopedNameRoute(prefix: string, suffix = ''): string {
  return `${prefix}/:scope{${PACKAGE_SCOPE_PART}}/:name{${PACKAGE_NAME_PART}}${suffix}`;
}

export function decodeScopeParam(scope: string): string {
  try {
    return decodeURIComponent(scope);
  } catch {
    return scope;
  }
}

export function requestPackageName(
  params: Record<string, string | undefined>,
): string {
  const scope = params.scope;
  const name = params.name ?? '';
  return ((scope ? `${decodeScopeParam(scope)}/` : '') + name).toLowerCase();
}
