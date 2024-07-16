import Router = require("koa-router");
import { httpAuth, onlineUserSockets } from "./authorization";
import { getPool } from "./database";
import { requestBodyContentType } from "./utils";

export function initNotification(router: Router) {
  router.post("/readNotifications", httpAuth, requestBodyContentType("application/json"), async (ctx, next) => {
    const pool = getPool();

    const { since } = ctx.request.body;
    const { sub: userID } = ctx.request.jwt.payload;
    const result = await pool.query(
      "SELECT id, created_time, content FROM notifications WHERE user_id = $1 AND created_time >= $2;",
      [userID, since]
    );

    ctx.body = result.rows;
    next();
  });
} 

// TODO the notification may lost, need more in-depth consideration.
/**
 * 
 * @param recipientID ID of the user that the notification is pushed to.
 * @param type an string describes the kind of a notification (e.g. plain-text, add-contact-request)
 * @param notificationContent should be a valid JSON value.
 */
export async function pushNotification(recipientID: number, type: string, notificationContent: any) {
  const pool = getPool();

  const createdTime = Date.now()
  const content = typeof notificationContent === "string"
    ? notificationContent
    : JSON.stringify(notificationContent);

  const result = await pool.query(
    "INSERT INTO notifications (created_time, type, content) VALUES ($1, $2, $3) RETURNING id;",
    [createdTime, type, content]
  );

  const notificationID = result.rows[0].id;

  const newNotification = {
    id: notificationID,
    content: notificationContent,
    createdTime
  };

  const recipientSocket = onlineUserSockets.get(recipientID);
  if (recipientSocket) {
    recipientSocket.emit("notification", newNotification)
  }
}
