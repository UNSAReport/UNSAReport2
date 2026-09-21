/**
 * Utility for converting an email address to a deterministic, URL-safe scope slug.
 *
 * Rules:
 * - Lowercase all characters
 * - Replace all characters outside [a-z0-9] with '-'
 * - Trim leading/trailing hyphens
 * - Prefix with '@'
 *
 * Example: 'User.Name+Tag@Example.COM' -> '@user-name-tag-example-com'
 */
export function emailToScopeSlug(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new Error('Email must be a non-empty string to generate a scope slug');
  }
  const sanitized = email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (sanitized.length === 0) {
    throw new Error(`Email "${email}" yielded an empty scope slug`);
  }

  return `@${sanitized}`;
}
