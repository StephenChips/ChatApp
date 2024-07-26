import { io, Socket } from "socket.io-client";
import { AppStore } from "./store";
import { idGenerator, NotificationActions } from "./store/notifications";
import axios from "axios";

let socket: Socket | undefined;

window.io = io;

export function getSocket() {
  return socket;
}

export function initSocket({
  logInToken,
  store,
}: {
  logInToken: string;
  store: AppStore;
}) {
  socket = io({ auth: { jwt: logInToken } });

  // TODO Add "connect", "disconnect" and "error" to handle connection failure.

  socket.on("connect", () => {
    console.log("connected");
  });

  socket.on("connect_error", (error) => {
    console.log(error);
  });

  socket.on("add-contact-request", async (addContactRequest) => {
    const { createdAt, status, recipientID, requesterID } = addContactRequest;
    const getUserPublicInfo = (id: unknown) =>
      axios.post("/api/getUserPublicInfo", { id });

    const [{ data: fromUser }, { data: toUser }] = await Promise.all([
      getUserPublicInfo(requesterID),
      getUserPublicInfo(recipientID),
    ]);

    store.dispatch(
      NotificationActions.upsertOne({
        id: idGenerator.next(),
        type: "add contact request",
        createdAt,
        request: {
          fromUser,
          toUser,
          requestStatus: status,
        },
      }),
    );
  });

  console.log(socket)

  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = undefined;
}
