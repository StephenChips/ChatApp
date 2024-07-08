import { readFile } from "fs/promises";
import { Pool, PoolConfig } from "pg";

const databaseConfig = require("../database.config.json") as PoolConfig

export const pool = new Pool(databaseConfig);

/**
 * @param filePath The path of the SQL file to be executed.
 * @returns 
 */
export async function runSQLFile(filePath: string) {
  const result = await readFile(filePath);
  const sql = result.toString();
  return pool.query(sql);
}