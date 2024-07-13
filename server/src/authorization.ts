import { getPool } from "./database";
import { createHash } from "node:crypto"
import * as JWT from "jsonwebtoken"
import * as Router from "koa-router";
import { jwtSecret } from "../settings";

const hash = createHash("sha256");

async function issueJWT(userID: number, password: string) {
  const pool = getPool()

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

export function initAuthorization(router: Router) {
  router.post("/issueJWT", async (ctx, next) => {
    if (ctx.request.type !== "application/json") {
      ctx.status = 400;
      ctx.body = { message: "requires a JSON body" };
      return next();
    }

    type PostBody = { userID: number; password: string; }
    ctx.type = "application/json";

    try {
      const { userID, password } = ctx.request.body as PostBody;
      const token = await issueJWT(userID, password);
      ctx.status = 200;
      ctx.body = { jwt: token };
    } catch (e) {
      const error = e as Error
      ctx.status = 400;
      ctx.body = { message: error.message };
    }
    
    return next();
  })
}
