import { and, eq } from "drizzle-orm";
import { encryptSecret } from "./crypto.js";

export type AuthUser = {
  id: string;
  googleSub: string;
  refreshTokenVersion: number;
};

async function loadDb() {
  const [{ db }, { users }] = await Promise.all([
    import("../db/index.js"),
    import("../db/schema.js"),
  ]);
  return { db, users };
}

export async function upsertOAuthUser(googleSub: string, refreshToken: string): Promise<AuthUser> {
  const { db, users } = await loadDb();
  const encryptedRefreshToken = encryptSecret(refreshToken);
  const now = new Date();

  const [row] = await db
    .insert(users)
    .values({
      googleSub,
      encryptedRefreshToken,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.googleSub,
      set: {
        encryptedRefreshToken,
        updatedAt: now,
      },
    })
    .returning({
      id: users.id,
      googleSub: users.googleSub,
      refreshTokenVersion: users.refreshTokenVersion,
    });

  if (!row) {
    throw new Error("Failed to persist OAuth user.");
  }

  return row;
}

export async function findSessionUser(
  userId: string,
  googleSub: string,
  refreshTokenVersion: number,
): Promise<AuthUser | null> {
  const { db, users } = await loadDb();
  const [row] = await db
    .select({
      id: users.id,
      googleSub: users.googleSub,
      refreshTokenVersion: users.refreshTokenVersion,
    })
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.googleSub, googleSub),
        eq(users.refreshTokenVersion, refreshTokenVersion),
      ),
    )
    .limit(1);

  return row ?? null;
}
