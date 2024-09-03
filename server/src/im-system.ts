import * as SocketIO from "socket.io";
import { emitSocketIOEvent, httpAuth } from "./authorization";
import { getPool } from "./database";
import Router = require("koa-router");
import { QueryResult } from "pg";
import { omit } from "lodash";

enum SocketIOEvents {
  Message = "im/message",
}

/**
 * Users should pass it's JWT to the server when connecting to the
 * server. The server will verify and store the token and view as
 * them as online. Later will users want to send messages to another
 * user via the server, they can just pass the user id instead sending
 * the JWT again. The server knows they've logged in and willforward the
 * message to the recipient.
 *
 * @param io
 */
export function initIMSystem(io: SocketIO.Server, router: Router) {
  io.on("connection", async (socket) => {
    socket.on(SocketIOEvents.Message, async (incomingMessage, callback) => {
      const senderID = socket.jwt.payload.sub;
      incomingMessage.senderID = socket.jwt.payload.sub;
      const sentAt = new Date();
      const recipientID = incomingMessage.recipientID;
      const id = await saveIncomingMessage(sentAt, incomingMessage);
      const outgoingMessage = { id, sentAt, ...incomingMessage };

      emitSocketIOEvent({
        event: SocketIOEvents.Message,
        toUser: [senderID, recipientID],
        data: outgoingMessage,
        excludedSocket: socket
      });

      callback(null, outgoingMessage);
    });
  });

  router.post("/api/getContactMessages", httpAuth, async (ctx) => {
    const userID = ctx.request.jwt!.payload.sub;
    const {
      contactUserID,
      offset = 0,
      limit = 50,
    } = ctx.request.body;

    const pool = getPool();

    let result = await pool.query(
      `
      SELECT
        id,
        sent_at,
        sender_id,
        recipient_id,
        message_type,
        content
      FROM chatapp.contact_messages
      WHERE
        sender_id = $1 AND recipient_id = $2 OR
        recipient_id = $1 AND sender_id = $2
      ORDER BY id DESC
      LIMIT $3 OFFSET $4
      `,
      [userID, contactUserID, limit, offset]
    );

    result.rows.reverse();

    const messages = result.rows.map((row) => ({
      ...row.content,
      id: row.id,
      sentAt: row.sent_at,
      senderID: String(row.sender_id),
      recipientID: String(row.recipient_id),
      type: row.message_type,
    }));

    ctx.body = { messages };
  });
}

/**
 * The message here is sent from a client, and it doesn't has
 * `sentAt` and `id` property, which are generated by the
 * server when it reaches the server.
 *
 * @param sentAt
 * @param message
 * @returns {Promise<number>} the ID of new inserted message.
 */
async function saveIncomingMessage(sentAt: Date, message: any) {
  const pool = getPool();

  const meessageContent = omit(message, "recipientID", "senderID", "type");

  let result = await pool.query(
    `
    INSERT INTO chatapp.contact_messages
      (sent_at, recipient_id, sender_id, message_type, content)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [
      sentAt,
      message.recipientID,
      message.senderID,
      message.type,
      meessageContent,
    ]
  );

  return result.rows[0].id;
}
