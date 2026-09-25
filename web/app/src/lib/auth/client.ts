import { useRouterState } from '@tanstack/react-router';

export function useAuth() {
  const ctx = useRouterState({ select: (s) => s.matches[0]?.context });
  if (ctx && typeof ctx === 'object' && 'user' in ctx) {
    const user = (ctx as { user: unknown }).user;
    return { user: user ?? null, isAuthenticated: Boolean(user) };
  }
  return { user: null, isAuthenticated: false };
}
