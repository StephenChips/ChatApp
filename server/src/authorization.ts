import Crypto = require("crypto");
import { getPool } from "./database";
import * as JWT from "jsonwebtoken";
import * as Router from "koa-router";
import { jwtSecret } from "../settings";
import jwt = require("jsonwebtoken");
import Koa = require("koa");
import * as SocketIO from "socket.io";
import { requestBodyContentType } from "./utils";
import { QueryResult } from "pg";

export type JWTPayload = {
  sub: string; // the userID
};

declare module "koa" {
  interface Request extends Koa.BaseRequest {
    jwt?: { payload: JWTPayload };
  }
}

declare module "socket.io" {
  interface Socket {
    jwt?: { payload: JWTPayload };
  }
}

export function initAuthorization(router: Router) {
  router.post(
    "/api/issueJWT",
    requestBodyContentType("application/json"),
    async (ctx, next) => {
      try {
        type PostBody = { userID: string; password: string };
        const { userID, password } = ctx.request.body as PostBody;

        if (!userID.match(/^\d+$/)) {
          ctx.throw(400, "No such user");
        }

        const pool = getPool();
        let result: QueryResult;

        try {
          result = await pool.query(
            "SELECT password_hash, salt FROM chatapp.users WHERE id = $1;",
            [userID]
          );
        } catch (e) {
          // See https://www.postgresql.org/docs/12/errcodes-appendix.html for error codes' meaning.
          // 22003 stands for numeric_value_out_of_range.

          if (e.code === "22003") {
            ctx.throw(400, "No such user");
          } else {
            console.error(e);
            ctx.throw(500, e);
          }
        }

        if (result.rowCount === 0) {
          ctx.throw(400, "No such user");
        }

        const { password_hash, salt } = result.rows[0];

        if (createPasswordHash(password, salt) !== password_hash) {
          throw ctx.throw("Password is not correct");
        }

        const jwt: string = await new Promise((resolve, reject) => {
          JWT.sign(
            { sub: userID },
            jwtSecret,
            { algorithm: "HS256" },
            (error, token) => {
              if (error) reject(error);
              else resolve(token);
            }
          );
        });

        ctx.status = 200;
        ctx.body = { jwt };
      } catch (e) {
        const error = e as Error;
        ctx.status = 400;
        ctx.body = { message: error.message };
      }

      return next();
    }
  );
}

async function verifyJWT(token: string, jwtSecret: string) {
  return new Promise<JWTPayload>((resolve, reject) => {
    jwt.verify(token, jwtSecret, (error, jwtPayload) => {
      if (error) reject(new Error("Invalid JWT token"));
      else resolve(jwtPayload as unknown as JWTPayload);
    });
  });
}

export async function httpAuth(ctx: Koa.Context, next: Koa.Next) {
  const headerPrefix = "bearer ";
  const authHeader = ctx.headers.authorization;

  if (!authHeader) {
    ctx.throw(400, "Requires a JWT token");
  }

  if (!authHeader.toLowerCase().startsWith(headerPrefix)) {
    ctx.throw(400, "Invalid authorization header");
  }

  try {
    const token = authHeader.slice(headerPrefix.length);
    const payload = await verifyJWT(token, jwtSecret);
    ctx.request.jwt = { payload };
    return next();
  } catch (e) {
    const error = e as Error;
    ctx.throw(400, { message: error.message });
  }
}

export type UserID = string;
export const onlineUserSockets = new Map<UserID, SocketIO.Socket>();

export function emitEvent(event: string, userID: string | number, data?: any) {
  if (typeof userID === "number") {
    userID = String(userID);
  }

  const recipientSocket = onlineUserSockets.get(userID);
  if (recipientSocket) {
    if (data) recipientSocket.emit(event, data);
    else recipientSocket.emit(event);
  }
}

export async function socketIOAuth(
  socket: SocketIO.Socket,
  next: (err?: Error) => void
) {
  let userID: string;

  try {
    socket.jwt = {
      payload: await verifyJWT(socket.handshake.auth.jwt, jwtSecret),
    };
    userID = socket.jwt.payload.sub;
  } catch (e) {
    next(e as Error);
    return;
  }

  if (onlineUserSockets.has(userID)) {
    next(new Error("User has logged in"));
    return;
  }

  onlineUserSockets.set(userID, socket);

  console.log(`User (ID: ${userID}) connected`);

  socket.on("disconnect", () => {
    console.log(`User (UserID: ${userID}) disconnected.`);
    onlineUserSockets.delete(userID);
  });

  next();
}

function createPasswordHash(password: string, salt: string) {
  const hashAlgorithm = Crypto.createHash("sha256");
  hashAlgorithm.update(password + salt);
  return hashAlgorithm.digest().toString("base64url");
}
