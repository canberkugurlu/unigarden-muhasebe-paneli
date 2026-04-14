import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient(): PrismaClient {
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

/**
 * Lazy-initialized Prisma — build-time "collecting page data" aşamasında
 * DATABASE_URL henüz yüklenmemiş olabilir; client'ı ilk erişimde oluşturuyoruz.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = globalForPrisma.prisma ?? (globalForPrisma.prisma = createPrismaClient());
    // @ts-expect-error dinamik property erişimi
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
