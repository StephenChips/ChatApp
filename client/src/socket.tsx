import { io, Socket } from "socket.io-client";
import { AppDispatch } from "./store";
import { NotificationActions } from "./store/notifications";
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

  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = undefined;
}
