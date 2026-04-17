import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// Prisma 7 requires a driver adapter — use libsql for SQLite file (dev)
// or Turso (production) via TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars.
let prisma: PrismaClient;

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  const adapter = tursoUrl
    ? new PrismaLibSql({ url: tursoUrl, authToken: tursoToken })
    : new PrismaLibSql({ url: `file:${path.resolve(process.cwd(), "dev.db")}` });

  return new PrismaClient({ adapter } as any);
}

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

export { prisma };
