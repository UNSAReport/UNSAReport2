import { eq } from 'drizzle-orm';
import { config } from '@/config';
import { db } from '@/db/index';
import { userRoles } from '@/db/schema';
import type { Role } from '@/types';

export type DatabaseOrTransaction =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function getUserRoles(
  userId: string,
  tx: DatabaseOrTransaction = db,
): Promise<Record<string, Role>> {
  const rows = await tx
    .select({ subApp: userRoles.subApp, role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  return Object.fromEntries(rows.map((r) => [r.subApp, r.role as Role]));
}

export async function assignDefaultRoles(
  userId: string,
  tx: DatabaseOrTransaction = db,
): Promise<void> {
  if (config.defaultSubApps.length === 0) {
    return;
  }
  const roleValues = config.defaultSubApps.map((subApp) => ({
    userId,
    subApp,
    role: config.defaultRole,
  }));
  await tx
    .insert(userRoles)
    .values(roleValues)
    .onConflictDoNothing({
      target: [userRoles.userId, userRoles.subApp],
    });
}
