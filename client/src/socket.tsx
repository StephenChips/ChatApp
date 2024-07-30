import { io, Socket } from "socket.io-client";
import { AppDispatch, RootState } from "./store";
import { NotificationActions } from "./store/notifications";
import {
  addMessage,
  selectContactByUserID,
} from "./store/contacts";
import { Message } from "./store/modeltypes";

let socket: Socket | undefined;

export function useSocket() {
  return socket;
}

export function initSocket({
  logInToken,
  dispatch,
  getState,
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

  socket.on("im/message", (msg) => {
    const contact = selectContactByUserID(getState(), msg.senderID);
    const message: Message = {
      id: contact.messages.length,
      status: "succeeded",
      ...msg,
    };

    dispatch(
      addMessage({
        contactUserID: msg.senderID,
        message,
      }),
    );
  });

  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = undefined;
}
