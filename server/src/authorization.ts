import { getPool } from "./database";
import { createHash } from "node:crypto"
import * as JWT from "jsonwebtoken"

const pool = getPool()
const hash = createHash("sha256");

export async function issueJWT(userID: string, password: string, jwtSecret: string) {
  const result = await pool.query("SELECT password_hash, salt FROM users WHERE userID = $1;", [userID]);

  if (result.rowCount === 0) {
    throw new Error("No such user");
  }

  const { password_hash, salt } = result.rows[0];

  hash.update(password + salt);

  if (hash.digest("hex") !== password_hash) {
    throw new Error("Password is not correct");
  }

  return new Promise((resolve, reject) => {
    JWT.sign({ sub: userID }, jwtSecret, { algorithm: "HS256" }, (error, token) => {
      if (error) reject(error);
      else resolve(token)
    })
  })
}
