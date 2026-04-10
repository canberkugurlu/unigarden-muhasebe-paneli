import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL tanımlı değil");

  let libsqlUrl = url;
  let authToken: string | undefined;

  if (url.includes("?authToken=")) {
    const [baseUrl, tokenPart] = url.split("?authToken=");
    libsqlUrl = baseUrl;
    authToken = tokenPart;
  }

  const adapter = new PrismaLibSql({ url: libsqlUrl, authToken });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
