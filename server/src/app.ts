import { resolve } from "path";
import * as http from "http";
import * as Koa from "koa";
import * as Router from "koa-router"
import * as serve from "koa-static";
import { koaBody } from "koa-body"
import * as SocketIO from "socket.io";

import { initPool, runSQLFile } from "./database";

import { initIMSystem } from "./im-system"
import { PoolConfig } from "pg";
import { initAuthorization } from "./authorization";

export type AppEnv = {
  jwtSecret: string,
  databaseConfig: PoolConfig,
  port?: number
}

export async function startApp(env: AppEnv) {
  setDefaultValues(env, {
    port: 8080
  });

  console.log("Creating database (if it hasn't been created yet)")
  await runSQLFile(resolve(__dirname, "../sql/init.sql"));
  console.log("Database is created.");

  console.log()

  console.log("Starting the server")
  const app = new Koa();
  const router = new Router()
  app.use(serve(resolve(__dirname, "../public")));

  const httpServer = http.createServer(app.callback())
  const io = new SocketIO.Server(httpServer);
  initIMSystem(io, env.jwtSecret)
  httpServer.listen(env.port, () => {
    console.log("The server is started at the port " + env.port);
  })

  initPool(env.databaseConfig)

  initAuthorization(router);

  app.use(koaBody());
  app.use(router.routes())
}

function setDefaultValues<T extends object>(object: T, defaultValues: Partial<T>) {
  for (const key in defaultValues) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      continue;
    }
    object[key] = defaultValues[key];
  }
}