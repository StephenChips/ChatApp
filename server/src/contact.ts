import Router = require("koa-router");
import { httpAuth, onlineUserSockets } from "./authorization";
import { requestBodyContentType } from "./utils";
import { getPool } from "./database";
import { Context } from "koa";

export function initContact(route: Router) {
  const pool = getPool();

  route.post("/getContacts", httpAuth, requestBodyContentType("application/json"), async (ctx, next) => {
    type RequestBody = { id: number };
    const requestBody = ctx.request.body as RequestBody;

    const result = await pool.query(`
      SELECT id, name, avatar_url FROM
        (
          SELECT
            CASE WHEN id = $1 THEN contact_user_id
            ELSE id END AS contact_user_id
          FROM
            chatapp.users AS usersA
          INNER JOIN
            chatapp.contacts ON id = user_id
          WHERE
            usersA.id = $1 OR contact_user_id = $1
        ),
        users
      WHERE contact_user_id = users.id
    `, [requestBody.id]);

    ctx.body = result.rows;

    next();
  });

  route.post("/createAddContactRequest", httpAuth, async (ctx, next) => {
    type RequestBody = { recipient_id: number };
    const requestBody = ctx.request.body as RequestBody;

    const client = await pool.connect();

    try {
      let result = await client.query(
        "SELECT id, name, avatar_url FROM chatapp.users WHERE id = $1",
        [requestBody.recipient_id]
      );

      if (result.rows.length === 0) {
        ctx.throw(400, "No such recipient");
      }

      const toUser = result.rows[0];

      result = await client.query(
        "SELECT id, name, avatar_url FROM chatapp.users WHERE id = $1",
        [ctx.request.jwt.payload.sub]
      );
      const fromUser = result.rows[0];

      const creationTime = Date.now();
      const content = {
        type: "add contact request",
        request: { fromUser, toUser },
        requestStatus: "pending"
      };

      result = await pool.query(
        "INSERT INTO notifications (created_time, content) VALUES ($1, $2) RETURNING id;",
        [creationTime, JSON.stringify(content)]
      );

      const notification = {
        ...content,
        id: result.rows[0].id,
        creationTime
      };

      const recipientSocket = onlineUserSockets.get(requestBody.recipient_id);
      if (recipientSocket) {
        recipientSocket.emit("notification", notification)
      }
    } finally {
      client.release();
      next();
    }
  });

  route.post("/agreeAddContactRequest", httpAuth, setAddContactRequestStatus("agreed"));

  route.post("/rejectAddContactRequest", httpAuth, setAddContactRequestStatus("rejected"));

  function setAddContactRequestStatus(status: "agreed" | "rejected") {
    return async (ctx: Context, next: () => void) => {
      type RequestBody = { request_id: number };
      const requestBody = ctx.request.body as RequestBody;
      const client = await pool.connect();

      try {
        const result = await pool.query(
          "SELECT content FROM chatapp.notifications WHERE id = $1",
          [requestBody.request_id]
        );

        if (result.rows.length === 0) {
          ctx.throw("No such add contact request");
        }

        const request = JSON.parse(result.rows[0].content);
        request.requestStatus = status;

        await pool.query(
          "UPDATE notifications SET content = $1 WHERE id = $2;",
          [JSON.stringify(request), requestBody.request_id]
        );
      } finally {
        client.release();
        next();
      }
    }
  }
}
