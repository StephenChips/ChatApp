import * as SocketIO from "socket.io";
import { onlineUserSockets } from "./authorization";
import { getPool } from "./database";

type UserID = string;

interface Message {
  senderID: UserID;
  recipientID: UserID;
  sentAt: string; // UTC time in ISO string format.
}

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
export function initIMSystem(io: SocketIO.Server) {
  io.on("connection", async (socket) => {
    const userID = socket.jwt.payload.sub;

    socket.on(SocketIOEvents.Message, async (message: Message, callback) => {
      const recipientSocket = onlineUserSockets.get(message.recipientID);
      const isRecipientOffline = recipientSocket === undefined;

      if (isRecipientOffline) {
        await saveOfflineMessages(message);
      } else {
        recipientSocket.emit(SocketIOEvents.Message, message);
      }

      callback();
    });

    await sendOfflineMessages(socket, userID);
  });
}

async function saveOfflineMessages(message: Message) {
  const pool = getPool();
  pool.query(
    "INSERT INTO chatapp.offline_messages (user_id, sent_at, message) VALUES ($1, $2, $3);",
    [message.recipientID, message.sentAt,JSON.stringify(message)]
  );
}

async function sendOfflineMessages(socket: SocketIO.Socket, userID: UserID) {
  const pool = getPool();

  const { rows } = await pool.query(
    "SELECT message FROM chatapp.offline_messages WHERE user_id = $1 ORDER BY sent_at ASC",
    [userID]
  );

  for (const { message: messageText } of rows) {
    const message = JSON.parse(messageText);
    socket.emit(SocketIOEvents.Message, message);
  }

  await pool.query("DELETE FROM chatapp.offline_messages where user_id = $1", [userID]);
}
