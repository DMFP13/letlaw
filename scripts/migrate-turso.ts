/**
 * Apply Prisma migration SQL files directly to Turso via @libsql/client.
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npx ts-node scripts/migrate-turso.ts
 */
import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) throw new Error("TURSO_DATABASE_URL is required");

const client = createClient({ url, authToken });

async function run() {
  const migrationsDir = path.resolve(process.cwd(), "prisma/migrations");
  const dirs = fs
    .readdirSync(migrationsDir)
    .filter((d) => fs.statSync(path.join(migrationsDir, d)).isDirectory())
    .sort();

  for (const dir of dirs) {
    const sqlFile = path.join(migrationsDir, dir, "migration.sql");
    if (!fs.existsSync(sqlFile)) continue;

    const sql = fs.readFileSync(sqlFile, "utf-8");
    console.log(`Applying migration: ${dir}`);

    // Split on semicolons but keep statements intact
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await client.execute(stmt.endsWith(";") ? stmt : stmt + ";");
      } catch (err: any) {
        // Ignore "already exists" errors — idempotent re-run
        if (err.message?.includes("already exists") || err.message?.includes("duplicate")) {
          console.log(`  ↳ skipped (already exists)`);
        } else {
          throw err;
        }
      }
    }
    console.log(`  ✓ done`);
  }

  console.log("\n✅ All migrations applied to Turso");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
