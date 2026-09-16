import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let drizzleDb: any = null;
let cachedConnectedStatus: boolean | null = null;
let lastCheckTime = 0;

export function getPool(): pg.Pool | null {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  try {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("sslmode=require") || connectionString.includes("neon.tech") || connectionString.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.warn("[PostgreSQL Pool Error]:", err.message);
      cachedConnectedStatus = false;
    });

    return pool;
  } catch (err) {
    console.warn("[PostgreSQL Initialization Error]:", err);
    return null;
  }
}

export function getDb() {
  if (drizzleDb) return drizzleDb;

  const p = getPool();
  if (p) {
    try {
      drizzleDb = drizzle(p, { schema });
      return drizzleDb;
    } catch (err) {
      console.warn("[Drizzle Init Error]:", err);
    }
  }

  // Graceful no-op proxy fallback when Postgres is not reachable
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
  };

  return new Proxy({} as any, {
    get: (_, prop) =>
      prop === "query"
        ? new Proxy({}, { get: () => noOp })
        : async () => [],
  });
}

export const db = getDb();

export async function isDbConnected(): Promise<boolean> {
  const now = Date.now();
  // Cache check for 10 seconds to avoid ping storms
  if (cachedConnectedStatus !== null && now - lastCheckTime < 10000) {
    return cachedConnectedStatus;
  }

  const p = getPool();
  if (!p) {
    cachedConnectedStatus = false;
    lastCheckTime = now;
    return false;
  }

  try {
    const client = await p.connect();
    await client.query("SELECT 1 AS alive");
    client.release();
    cachedConnectedStatus = true;
    lastCheckTime = now;
    return true;
  } catch (err: any) {
    cachedConnectedStatus = false;
    lastCheckTime = now;
    return false;
  }
}

export { schema };
