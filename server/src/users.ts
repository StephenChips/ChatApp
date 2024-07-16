import Router = require("koa-router");
import { getPool } from "./database";
import Crypto = require("node:crypto");
import { promisify } from "node:util";
import { httpAuth } from "./authorization";
import { requestBodyContentType } from "./utils";

const randomBytes = promisify(Crypto.randomBytes);

const hashAlgorithm = Crypto.createHash("sha256");

export function createPasswordHash(password: string, salt: string) {
  hashAlgorithm.update(password + salt)
  return hashAlgorithm.digest().toString("base64url");
}

export function initUser(router: Router) {
  const pool = getPool();

  router.post("/createUser", requestBodyContentType("application/json"), async (ctx, next) => {
    type RequestBody = {
      name: string;
      password: string;
      avatarURL?: string;
    };

    const requestBody = ctx.request.body as RequestBody;

    let avatarURL: string;
    if (requestBody.avatarURL === undefined) {
      const result = await pool.query("SELECT url FROM default_avatars LIMITS 1;");
      avatarURL = result.rows[0].url;
    } else {
      avatarURL = requestBody.avatarURL;
    }

    const salt = (await randomBytes(24)).toString("base64url");
    const passwordHash = createPasswordHash(requestBody.password, salt)

    const result = await pool.query(
      "INSERT INTO users (name, avatar_url, password_hash, salt) VALUES ($1, $2, $3, $4) RETURNNING id;",
      [requestBody.name, avatarURL, passwordHash, salt]
    );
    const id = result.rows[0].id;

    ctx.body = { id };

    next();
  });

  router.post("/getUserPublicInfo", requestBodyContentType("application/json"), async (ctx, next) => {
    type RequestBody = { id: number };
    const requerstBody = ctx.request.body as RequestBody;

    const result = await pool.query("SELECT id, name, avatar_url FROM users WHERE id = $1;"[requerstBody.id]);
    if (result.rows.length === 0) ctx.throw(400, "No such user");
    const user = result.rows[0];
    ctx.body = user;

    next();
  });

  router.post("/setUserName", httpAuth, requestBodyContentType("application/json"), async (ctx, next) => {
    type RequestBody = { id: number, name: string };
    const { id, name } = ctx.request.body as RequestBody;
    await pool.query("UPDATE users SET name = $1 WHERE id = $2", [name, id]);
    next();
  })
  
  router.post("/setUserAvatarURL", httpAuth, requestBodyContentType("application/json"), async (ctx, next) => {
    type RequestBody = { id: number, avatarURL: string };
    const { id, avatarURL } = ctx.request.body as RequestBody;
    await pool.query("UPDATE users SET avatar_url = $1 WHERE id = $2", [avatarURL, id]);
    next();
  })
  
  router.post("/setUserPassword", httpAuth, requestBodyContentType("application/json"), async (ctx, next) => {
    type RequestBody = { id: number, password: string };
    const { id, password } = ctx.request.body as RequestBody;

    const result = await pool.query("SELECT salt FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) ctx.throw(400, "No such user");
    const salt = result.rows[0].salt;

    const passwordHash = createPasswordHash(password, salt);
    await pool.query("UPDATE users SET name = $1 WHERE id = $2", [passwordHash, id]);

    next();
  })
}

