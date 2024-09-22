import { createReadStream, readFileSync } from "fs";
import { resolve } from "path";
import * as http from "http";
import * as https from "https";
import * as Koa from "koa";
import * as Router from "koa-router";
import * as serve from "koa-static";
import { koaBody } from "koa-body";
import * as compress from "koa-compress";
import * as SocketIO from "socket.io";

import { initDatabasePool, runSQLFile } from "./database";

import { httpsEnabled, initAppSettings } from "./appSettings";
import { initIMSystem } from "./im-system";
import { initAuthorization, socketIOAuth } from "./authorization";
import { initUser } from "./users";
import initDefaultAvatars from "./default-avatars";
import { initContact } from "./contact";
import { initNotifications } from "./notification";

startApp();

async function startApp() {
  const settings = await initAppSettings();

  initDatabasePool(settings.postgreSQL);

  console.log("Creating database (if it hasn't been created yet)");
  await runSQLFile(resolve(__dirname, "../sql/init.sql"));
  console.log("Database is created.");
  console.log();
  console.log("Starting the server");

  const app = new Koa();

  app.use(compress());

  const router = new Router();
  const httpServer = http.createServer(app.callback());
  const httpsServer = httpsEnabled()
    ? https.createServer(
        {
          cert: readFileSync(settings.https.certPath),
          key: readFileSync(settings.https.keyPath),
        },
        app.callback()
      )
    : null;

  const io = new SocketIO.Server(httpsEnabled() ? httpsServer : httpServer);
  io.use(socketIOAuth);

  if (httpsEnabled()) {
    app.use((ctx, next) => {
      if (ctx.secure) return next();

      const url = new URL(ctx.request.URL);
      url.protocol = "https";
      url.port = String(settings.https.port);

      ctx.status = 301;
      ctx.redirect(url.toString());

      next();
    });
  }

  app.use(
    koaBody({
      multipart: true,
      formidable: {
        keepExtensions: true,
      },
    })
  );

  initIMSystem(io, router);
  initAuthorization(router);
  initUser(router);
  initDefaultAvatars(router);
  initContact(router);
  initNotifications(router);

  router.get(/^.*$/, async (ctx) => {
    ctx.response.set("content-type", "text/html");
    ctx.body = createReadStream(resolve(__dirname, "../public/index.html"));
  });

  app.use(serve(resolve(__dirname, "../public")));
  app.use(router.routes());
  app.use(router.allowedMethods());

  httpsServer?.listen(settings.https.port, () => {
    console.log(
      "The HTTPS server is started at the port " + settings.https.port
    );
  });
  httpServer.listen(settings.http.port, () => {
    console.log("The HTTP server is started at the port " + settings.http.port);
  });
}
