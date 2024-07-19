import { readdir } from "fs/promises";
import Router = require("koa-router");
import path = require("path");

export default async function initDefaultAvatars(router: Router) {
  router.post("/getDefaultAvatarsURL", async (ctx) => {
    const dir = await readdir(path.resolve(__dirname, "../public/default-avatars"));
    ctx.body = dir.map((fileName) => "/public/default-avatars/" + fileName);
  });
}
