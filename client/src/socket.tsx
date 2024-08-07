import { io, Socket } from "socket.io-client";
import { AppDispatch, RootState } from "./store";
import { NotificationActions } from "./store/notifications";
import { addMessage } from "./store/contacts";

let socket: Socket | undefined;

export function getSocket() {
  return socket;
}

export function initSocket({
  logInToken,
  dispatch,
}: {
  logInToken: string;
  dispatch: AppDispatch;
  getState: () => RootState;
}) {
  socket = io({ auth: { jwt: logInToken } });

  // TODO Add "connect", "disconnect" and "error" to handle connection failure.

  socket.on("connect", () => {
    console.log("connected");
  });

  socket.on("connect_error", (error) => {
    console.log(error);
  });

  socket.on("notification/new", (notification) => {
    dispatch(NotificationActions.addOne(notification));
  });

  socket.on("im/message", async (msg) => {
    const message = {
      status: "succeeded",
      ...msg,
    };

    console.log(message)

    await dispatch(addMessage(message.senderID, message));
  });

  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = undefined;
}
