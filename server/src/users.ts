import Router = require("koa-router");
import { getPool } from "./database";
import Crypto = require("node:crypto");
import { promisify } from "node:util";
import { httpAuth } from "./authorization";
import { requestBodyContentType } from "./utils";
import formidable = require("formidable");
import { basename, dirname, extname, join } from "node:path";
import { copyFile, mkdir, unlink } from "node:fs/promises";

const randomBytes = promisify(Crypto.randomBytes);

export function createPasswordHash(password: string, salt: string) {
  const hashAlgorithm = Crypto.createHash("sha256");
  hashAlgorithm.update(password + salt)
  return hashAlgorithm.digest().toString("base64url");
}

export function initUser(router: Router) {
  const pool = getPool();

  router.post("/api/createUser", requestBodyContentType("application/json"), async (ctx) => {
    type RequestBody = {
      name: string;
      password: string;
      avatarURL?: string;
    };

    const requestBody = ctx.request.body as RequestBody;

    let avatarURL: string;
    if (requestBody.avatarURL === undefined) {
      avatarURL = "/default-avatars/avatar1.svg";
    } else {
      avatarURL = requestBody.avatarURL;
    }

    const salt = (await randomBytes(24)).toString("base64url");
    const passwordHash = createPasswordHash(requestBody.password, salt)

    const result = await pool.query(
      "INSERT INTO chatapp.users (name, avatar_url, password_hash, salt) VALUES ($1, $2, $3, $4) RETURNING id;",
      [requestBody.name, avatarURL, passwordHash, salt]
    );

    ctx.body = { id: result.rows[0].id.toString() };
  });

  router.post("/api/getUserPublicInfo", requestBodyContentType("application/json"), async (ctx) => {
    type RequestBody = { id: string };
    const requerstBody = ctx.request.body as RequestBody;

    const result = await pool.query("SELECT id, name, avatar_url FROM chatapp.users WHERE id = $1;", [requerstBody.id]);
    if (result.rows.length === 0) {
      ctx.throw(400, new Error("No such user"));
    }

    const { id, name, avatar_url } = result.rows[0];
    ctx.body = {
      id: String(id),
      name,
      avatarURL: avatar_url
    };
  });

  router.post("/api/setUsername", httpAuth, requestBodyContentType("application/json"), async (ctx) => {
    type RequestBody = { name: string };
    const id = ctx.request.jwt.payload.sub;
    const { name } = ctx.request.body as RequestBody
    const trimmedName = name.trim();

    if (trimmedName === "") {
      ctx.throw(400, new Error(`"${name}" isn't a valid usename`));
    }

    await pool.query("UPDATE chatapp.users SET name = $1 WHERE id = $2", [trimmedName, id]);
    ctx.body = null;
  })

  router.post("/api/setUserAvatar", httpAuth, requestBodyContentType("multipart/form-data"), async (ctx) => {
    type RequestBody = { url?: string };

    let { url } = ctx.request.body as RequestBody;
    const id = ctx.request.jwt.payload.sub;

    const multipart = ctx.request.files["imageFile"];
    let imageFile: formidable.File = Array.isArray(multipart) ? multipart[0] : multipart;

    if (!url && !imageFile) {
      ctx.throw(400, new Error("You must send a URL or an image file to set your avatar."));
    }
    
    if (imageFile) {
      const MAX_FILESIZE_KB = 1000;
      if (imageFile.size > MAX_FILESIZE_KB * 1000) {
        ctx.throw(400, new Error("The image uploaded is too large, the maximum size is " + MAX_FILESIZE_KB + " KB."));
      }

      const storePath = join(__dirname, `../public/userdata/${id}/user-avatar`);

      await mkdir(dirname(storePath), { recursive: true });
      await copyFile(imageFile.filepath, storePath);
      await unlink(imageFile.filepath);
      
      url = `/userdata/${id}/user-avatar`;
    }

    await pool.query("UPDATE chatapp.users SET avatar_url = $1 WHERE id = $2", [url, id]);

    ctx.body = { url };
  })

  router.post("/api/setUserPassword", httpAuth, requestBodyContentType("application/json"), async (ctx) => {
    type RequestBody = { password: string };

    const id = ctx.request.jwt.payload.sub;
    const { password } = ctx.request.body as RequestBody;

    const result = await pool.query("SELECT salt FROM chatapp.users WHERE id = $1", [id]);
    if (result.rows.length === 0) ctx.throw(400, new Error("No such user"));
    const salt = result.rows[0].salt;

    const passwordHash = createPasswordHash(password, salt);
    await pool.query("UPDATE chatapp.users SET password_hash = $1 WHERE id = $2", [passwordHash, id]);

    ctx.body = null;
  })
}
