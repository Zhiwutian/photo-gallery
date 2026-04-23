import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Google-authenticated user; OAuth + Drive fields filled in later slices. */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  googleSub: text("google_sub").notNull().unique(),
  encryptedRefreshToken: text("encrypted_refresh_token"),
  refreshTokenVersion: integer("refresh_token_version").default(0).notNull(),
  /** Google Drive folder id for gallery home (set in Slice 4). */
  defaultFolderId: text("default_folder_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
