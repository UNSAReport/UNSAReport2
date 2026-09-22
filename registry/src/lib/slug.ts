export function emailToScopeSlug(email: string): string {
  if (!email || typeof email !== 'string') {
    throw new Error(
      'Email must be a non-empty string to generate a scope slug',
    );
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
