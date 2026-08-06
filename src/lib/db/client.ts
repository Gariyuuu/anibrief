import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

let cached: ReturnType<typeof drizzle> | null = null;

/**
 * Lazy Neon (Postgres, via Drizzle's HTTP driver — no persistent connection
 * needed, which fits serverless routes well) client. Throws only when a
 * caller actually tries to touch the database with no DATABASE_URL set;
 * every call site is expected to check `isDatabaseConfigured()` first and
 * degrade gracefully (empty list, "sign in to save" prompt, etc.) instead
 * of letting this throw reach the user, per spec §42.
 */
export function db() {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "DATABASE_URL is not set. Personalization features (lists, favorites, alerts) require a Neon Postgres database — see ENVIRONMENT_VARIABLES.md."
    );
  }
  if (!cached) {
    const sql = neon(process.env.DATABASE_URL!);
    cached = drizzle(sql, { schema });
  }
  return cached;
}
