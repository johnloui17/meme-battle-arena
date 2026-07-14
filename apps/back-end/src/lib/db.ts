import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({ connectionString: env.DATABASE_URL });

export async function connectDb(): Promise<void> {
  await pool.query("SELECT 1");
}
