import { resolve } from "path";
import * as http from "http";
import * as Koa from "koa";
import * as Router from "koa-router"
import * as serve from "koa-static";
import { koaBody } from "koa-body"
import * as SocketIO from "socket.io";

import { getPool, initDatabasePool, runSQLFile } from "./database";

import { initIMSystem } from "./im-system"
import { PoolConfig } from "pg";
import { initAuthorization, socketIOAuth } from "./authorization";
import { initNotification } from "./notification";
import { initUser } from "./users";

export type AppEnv = {
  jwtSecret: string,
  databaseConfig: PoolConfig,
  port?: number
}

export async function startApp(env: AppEnv) {
  initDatabasePool(env.databaseConfig);

  setDefaultValues(env, {
    port: 8080
  });

  console.log("Creating database (if it hasn't been created yet)")
  await runSQLFile(resolve(__dirname, "../sql/init.sql"));
  console.log("Database is created.");

  console.log();

  console.log("Starting the server");
  const app = new Koa();
  const router = new Router();
  const httpServer = http.createServer(app.callback());
  const io = new SocketIO.Server(httpServer);
  
  io.use(socketIOAuth);

  app.use(serve(resolve(__dirname, "../public")));
  app.use(koaBody());
  app.use(router.routes());

  initIMSystem(io);
  initAuthorization(router);
  initNotification(router);
  initUser(router);

  httpServer.listen(env.port, () => {
    console.log("The server is started at the port " + env.port);
  })
}

function setDefaultValues<T extends object>(object: T, defaultValues: Partial<T>) {
  for (const key in defaultValues) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      continue;
    }
    object[key] = defaultValues[key];
  }
}
