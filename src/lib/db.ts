import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for production deployment. " +
      "Add it to your Vercel project environment variables."
    );
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });
}

// Singleton: re-use across hot reloads in dev, create once in prod
export const prisma: PrismaClient =
  global.__prisma ?? (global.__prisma = createPrismaClient());

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
