
import * as SocketIO from "socket.io";
import { onlineUserSockets } from "./authorization";

type UserID = string;

type Message = {
  senderID: UserID;
  recipientID: UserID;
  message: { content: any, contentType: string };
  createdTime: string;
};

enum SocketIOEvents {
  Message = "im/message"
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
      socket.on(SocketIOEvents.Message, (message: Message, callback) => {
        const recipientSocket = onlineUserSockets.get(message.recipientID)
        const isRecipientOffline = recipientSocket === undefined

        if (isRecipientOffline) {
          return;
        }

        recipientSocket.emit(SocketIOEvents.Message, message);
        callback();
      })
    })
}
