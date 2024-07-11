
import * as SocketIO from "socket.io";
import * as jwt from "jsonwebtoken"

type UserID = number;

type Message = {
  senderID: UserID;
  recipientID: UserID;
  message: { content: any, contentType: string };
  createdTime: string;
};

const onlineUserSockets = new Map<UserID, SocketIO.Socket>();

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
export function initIMSystem(io: SocketIO.Server, jwtSecret: string) {
  io.use(async (socket, next) => {
    let jwtPayload: jwt.JwtPayload;
    let userID: number;

    try {
      jwtPayload = await getJWTPayload(socket, jwtSecret)
    } catch (e) {
      next(e as Error)
      return;
    }

    userID = Number(jwtPayload.sub);

    onlineUserSockets.set(userID, socket);
    socket.on("disconnect", () => {
      onlineUserSockets.delete(userID)
    })

    next();
  })

  io.on("connection", async (socket) => {
    socket.on("message", (message: Message, callback) => {
      const recipientSocket = onlineUserSockets.get(message.recipientID)
      const isRecipientOffline = recipientSocket === undefined

      if (isRecipientOffline) {
        callback({ status: "failed" });
        return;
      }

      recipientSocket.emit("message", message);
    })
  })
}

async function getJWTPayload(socket: SocketIO.Socket, jwtSecret: string) {
  const headerPrefix = "bearer ";
  const authHeader = socket.request.headers["authorization"];

  if (!authHeader) {
    throw new Error("Requires a JWT token");
  }

  if (!authHeader.toLowerCase().startsWith(headerPrefix)) {
    throw new Error("Invalid authorization header");
  }

  const token = authHeader.slice(headerPrefix.length);

  return new Promise<jwt.JwtPayload>((resolve, reject) => {
    jwt.verify(token, jwtSecret, (error, jwtPayload) => {
      if (error) reject(new Error("Invalid JWT token"));
      else resolve(jwtPayload as jwt.JwtPayload);
    })
  })
}
