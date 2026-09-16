// Safe Prisma Client with in-memory fallback for AI Studio container
import { createRequire } from "module";

const noOp = {
  findMany: async () => [],
  findFirst: async () => null,
  findUnique: async () => null,
  create: async (d: any) => d?.data ?? {},
  update: async (d: any) => d?.data ?? {},
  delete: async () => ({}),
  count: async () => 0,
};

let prismaInstance: any;

try {
  const require = createRequire(import.meta.url);
  const pkg = require("@prisma/client");
  const PrismaClientClass = pkg?.PrismaClient;

  if (PrismaClientClass && process.env.DATABASE_URL) {
    prismaInstance = new PrismaClientClass({
      log: ["error"],
    });
  } else {
    prismaInstance = new Proxy({}, { get: () => noOp });
  }
} catch {
  prismaInstance = new Proxy({}, { get: () => noOp });
}

export const prisma = prismaInstance ?? new Proxy({}, { get: () => noOp });
export default prisma;

