import Router = require("koa-router");
import { httpAuth, onlineUserSockets } from "./authorization";
import { requestBodyContentType } from "./utils";
import { getPool } from "./database";
import { Context } from "koa";

export function initContact(route: Router) {
  const pool = getPool();

  route.post(
    "/api/getContacts",
    httpAuth,
    requestBodyContentType("application/json"),
    async (ctx, next) => {
      type RequestBody = { id: number };
      const requestBody = ctx.request.body as RequestBody;

      const result = await pool.query(
        `
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
    `,
        [requestBody.id]
      );

      ctx.body = result.rows;

      next();
    }
  );

  route.post(
    "/api/createAddContactRequest",
    httpAuth,
    requestBodyContentType("application/json"),
    async (ctx) => {
      type RequestBody = { recipientID: string };
      const requestBody = ctx.request.body as RequestBody;

      let client = await pool.connect();

      try {
        const requesterID = ctx.request.jwt.payload.sub;
        const recipientID = requestBody.recipientID;

        let result = await client.query(
          "SELECT id FROM chatapp.users WHERE id = $1",
          [requestBody.recipientID]
        );

        if (result.rows.length === 0) {
          ctx.throw(400, "No such recipient");
        }

        const createdAt = new Date().toISOString();

        result = await client.query(
          "INSERT INTO chatapp.add_contact_requests (created_at, requester_id, recipient_id, status) VALUES ($1, $2, $3, $4) RETURNING id;",
          [createdAt, requesterID, recipientID, "pending"]
        );

        const addContactRequest = {
          id: result.rows[0].id,
          createdAt,
          requesterID: String(requesterID),
          recipientID: String(recipientID),
        };

        const recipientSocket = onlineUserSockets.get(
          Number(requestBody.recipientID)
        );

        if (recipientSocket) {
          recipientSocket.emit("add-contact-request", addContactRequest);
        }

        ctx.body = addContactRequest;
        ctx.status = 200;
      } finally {
        client.release();
      }
    }
  );

  route.post("/api/getAddContactRequests", httpAuth, async (ctx) => {
    const userID = ctx.request.jwt.payload.sub;

    const result = await pool.query(
      `
      SELECT
        id, created_at, requester_id, recipient_id, status
      FROM
        chatapp.add_contact_requests
      WHERE
        requester_id = $1 OR recipient_id = $1
      ORDER BY
        created_at DESC
      `,
      [userID]
    );

    ctx.status = 200;
    ctx.body = result.rows.map((item) => ({
      id: item.id,
      createdAt: item.created_at,
      requesterID: item.requester_id,
      recipientID: item.recipient_id,
      status: item.status,
    }));
  });

  route.post(
    "/api/setAddContactRequestStatus",
    httpAuth,
    async (ctx: Context, next: () => void) => {
      type RequestBody = { requestID: string; status: string };
      const requestBody = ctx.request.body as RequestBody;

      const { status } = requestBody;
      if (status !== "rejected" && status !== "agreed" && status !== "pending") {
        ctx.throw(400, "Invalid arguments");
      }

      const client = await pool.connect();
      try {
        const result = await pool.query(
          "SELECT id, recipient_id FROM chatapp.add_contact_requests WHERE id = $1 AND recipient_id = $2",
          [requestBody.requestID, ctx.request.jwt.payload.sub]
        );

        if (result.rows.length === 0) {
          ctx.throw("No such add contact request");
        }

        await pool.query(
          "UPDATE chatapp.add_contact_requests SET status = $1 WHERE id = $2;",
          [status, requestBody.requestID]
        );
      } finally {
        client.release();
        next();
      }
    }
  );
}
