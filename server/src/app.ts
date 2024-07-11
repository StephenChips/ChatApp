import { resolve } from "path";
import * as http from "http";
import * as Koa from "koa";
import * as serve from "koa-static";
import * as SocketIO from "socket.io";

import { runSQLFile } from "./database";

import { initializeIMSystem } from "./im-system"

const PORT = 8080

export type AppEnv = {
  jwtSecret: string
}

export async function startApp(env: AppEnv) {
  console.log("Creating database (if it hasn't been created yet)")
  await runSQLFile(resolve(__dirname, "../sql/init.sql"));
  console.log("Database is created.");

  console.log()

  console.log("Starting the server")
  const app = new Koa();
  app.use(serve(resolve(__dirname, "../public")));
  const httpServer = http.createServer(app.callback())
  const io = new SocketIO.Server(httpServer);
  initializeIMSystem(io, env.jwtSecret)
  httpServer.listen(PORT, () => {
    console.log("The server is started at the port " + PORT);
  })
}
