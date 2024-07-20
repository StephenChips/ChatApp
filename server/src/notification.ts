import Router = require("koa-router");
import { httpAuth, onlineUserSockets } from "./authorization";
import { getPool } from "./database";
import { requestBodyContentType } from "./utils";

export function initNotification(router: Router) {
  router.post("/api/getNotifications", httpAuth, requestBodyContentType("application/json"), async (ctx, next) => {
    const pool = getPool();

    const { since } = ctx.request.body;
    const { sub: userID } = ctx.request.jwt.payload;
    const result = await pool.query(
      `
      SELECT
        id, created_time, content
      FROM
        notifications
      WHERE
        user_id = $1 AND created_time >= $2
      ORDER BY
        created_time;
      `,
      [userID, since]
    );

    ctx.body = result.rows.map(item => ({
      ...item.content,
      id: item.id,
      creationTime: item.created_time
    }));
    
    next();
  });
} 
