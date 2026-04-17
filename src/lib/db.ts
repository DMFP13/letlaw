import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

// Prisma 7 requires a driver adapter — use libsql for SQLite file
let prisma: PrismaClient;

function createPrismaClient() {
  // Resolve DB path relative to the project root (cwd at runtime)
  const dbPath = path.resolve(process.cwd(), "dev.db");
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
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
