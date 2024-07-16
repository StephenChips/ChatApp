import { getPool } from "./database";
import { createHash } from "node:crypto"
import * as JWT from "jsonwebtoken"
import * as Router from "koa-router";
import { jwtSecret } from "../settings";
import jwt = require("jsonwebtoken")
import Koa = require("koa")
import * as SocketIO from "socket.io";
import { requestBodyContentType } from "./utils";

const hash = createHash("sha256");

export type JWTPayload = {
  sub: number // the userID
};

declare module "koa" {
  interface Request extends Koa.BaseRequest {
    jwt?: { payload: JWTPayload }
  }
}

declare module "socket.io" {
  interface Socket {
    jwt?: { payload: JWTPayload }
  }
}

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

async function getJWTPayload(authHeader: string, jwtSecret: string) {
  const headerPrefix = "bearer ";

  if (!authHeader) {
    throw new Error("Requires a JWT token");
  }

  if (!authHeader.toLowerCase().startsWith(headerPrefix)) {
    throw new Error("Invalid authorization header");
  }

  const token = authHeader.slice(headerPrefix.length);

  return new Promise<JWTPayload>((resolve, reject) => {
    jwt.verify(token, jwtSecret, (error, jwtPayload) => {
      if (error) reject(new Error("Invalid JWT token"));
      else resolve((jwtPayload as unknown) as JWTPayload);
    })
  })
}

export function initAuthorization(router: Router) {
  router.post("/issueJWT", requestBodyContentType("application/json"), async (ctx, next) => {
    try {
      type PostBody = { userID: number; password: string; }
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

export async function httpAuth(ctx: Koa.Context, next: Koa.Next) {
  try {
    const payload = await getJWTPayload(ctx.header.authorization, jwtSecret);
    ctx.request.jwt = { payload };
    next();
  } catch (e) {
    const error = e as Error;
    ctx.throw(400, error.message);
  }
}

export type UserID = number;
export const onlineUserSockets = new Map<UserID, SocketIO.Socket>();

export async function socketIOAuth(socket: SocketIO.Socket, next: (err?: Error) => void) {
  let userID: number;

  try {
    const authHeader = socket.request.headers["authorization"];
    const jwtPayload = await getJWTPayload(authHeader, jwtSecret)
    userID = jwtPayload.sub;
    socket.jwt.payload = jwtPayload;
  } catch (e) {
    next(e as Error)
    return;
  }

  if (onlineUserSockets.has(userID)) {
    next(new Error("User has logged in"));
    return;
  }

  onlineUserSockets.set(userID, socket);
  socket.on("disconnect", () => {
    onlineUserSockets.delete(userID);
  });

  next();
}
