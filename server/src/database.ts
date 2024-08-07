import { readFile } from "fs/promises";
import { Pool, PoolClient, PoolConfig } from "pg";

let pool: Pool;

export function getPool() {
  return pool;
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await callback(client);
    await client.query("COMMIT");
    return res;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
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
