import { readFile } from "fs/promises";
import { Pool, PoolConfig } from "pg";

let pool: Pool

export function getPool() {
  return pool;
}

export function initDatabasePool(poolConfig: PoolConfig) {
  pool = new Pool(poolConfig);
}

/**
 * @param filePath The path of the SQL file to be executed.
 * @returns 
 */
export async function runSQLFile(filePath: string) {
  const result = await readFile(filePath);
  const sql = result.toString();
  return pool.query(sql);
}
