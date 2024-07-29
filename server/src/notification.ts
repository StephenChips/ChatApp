import Router = require("koa-router");
import { getPool } from "./database";
import { httpAuth } from "./authorization";

export function initNotifications(router: Router) {
  router.post("/api/getNotifications", httpAuth, async (ctx) => {
    const pool = getPool();

    const { rows } = await pool.query(
      `
      SELECT
        ACRN.id AS id,
        ACRN.created_at,
        ACRN.has_read,
        ACRN.user_id,
        REQ.id AS requester_id,
        REQ.name AS requester_name,
        REQ.avatar_url AS requester_avatar_url,
        REC.id AS recipient_id,
        REC.name AS recipient_name,
        REC.avatar_url AS recipient_avatar_url,
        ACR.id AS add_contact_request_id,
        ACR.status
      FROM
        chatapp.add_contact_request_notifications AS ACRN
      INNER JOIN chatapp.add_contact_requests AS ACR
        ON ACRN.add_contact_request_id = ACR.id
      INNER join chatapp.users AS REQ
        ON ACR.requester_id = REQ.id
      INNER JOIN chatapp.users AS REC
        ON ACR.recipient_id = REC.id
      WHERE ACRN.user_id = $1
    `,
      [ctx.request.jwt.payload.sub]
    );

    ctx.body = rows.map((row) => ({
      id: row.id,
      type: "add contact request",
      createdAt: row.created_at,
      hasRead: row.has_read,
      request: {
        id: row.add_contact_request_id,
        fromUser: {
          id: row.requester_id,
          name: row.requester_name,
          avatarURL: row.requester_avatar_url,
        },
        toUser: {
          id: row.recipient_id,
          name: row.recipient_name,
          avatarURL: row.recipient_avatar_url,
        },
        requestStatus: row.status,
      },
    }));
  });

  router.post("/api/setNotificationHasRead", httpAuth, async (ctx) => {
    const pool = getPool();
    type RequestBody = { id: number; hasRead: boolean }[];
    const list = ctx.request.body as RequestBody;

    let client = await pool.connect();
    try {
      await Promise.all(
        list.map(({ id, hasRead }) => {
          return pool.query(
            "UPDATE chatapp.add_contact_request_notifications SET has_read = $1 WHERE id = $2",
            [hasRead, id]
          );
        })
      );

      ctx.body = null;
    } finally {
      client?.release();
    }
  });
}
