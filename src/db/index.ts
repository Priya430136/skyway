import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let pool: pg.Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!dbInstance) {
    const connectionString = process.env.DATABASE_URL;

    pool = new Pool({
      connectionString: connectionString || "postgres://skyway_admin:skyway_secure_pass@localhost:5432/skyway_airlines",
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    });

    dbInstance = drizzle(pool, { schema });
  }

  return dbInstance;
}

export async function isDbConnected(): Promise<boolean> {
  try {
    const client = await pool?.connect();
    if (client) {
      await client.query("SELECT 1");
      client.release();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export { schema };
