export function stripBearer(
  authHeader: string | null | undefined,
): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);
  if (token.length === 0 || token[0] === ' ' || token[0] === '\t') {
    return null;
  }
  return token;
}
