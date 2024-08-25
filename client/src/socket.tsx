import { io, Socket } from "socket.io-client";
import { AppDispatch, RootState } from "./store";
import { NotificationThunks } from "./store/notifications";
import {
  addMessage,
  deleteContact,
  initContactsStore,
  selectContactByUserID,
} from "./store/contacts";
import { AppAlertActions } from "./store/appAlert";
import { selectAppUser } from "./store/appUser";

let socket: Socket | undefined;

export function getSocket() {
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

  socket.on("notifications/updated", () => {
    dispatch(NotificationThunks.initStore());
  });

  socket.on("contacts/updated", () => {
    dispatch(initContactsStore());
  });

  socket.on("contacts/deleted", ({ deleterID, deleteeID }) => {
    const appUser = selectAppUser(getState());
    if (appUser!.id === deleterID) {
      const contact = selectContactByUserID(
        getState(),
        deleteeID,
      );
      const deletedUser = contact.user;
      dispatch(deleteContact(deletedUser.id));
      dispatch(
        AppAlertActions.show({
          severity: "info",
          alertText: `User ${deletedUser.name} (ID: ${deletedUser.id}) has been deleted from your contact list.`,
        }),
      );
    } else {
      const { user: deletedUser } = selectContactByUserID(
        getState(),
        deleterID,
      );
      dispatch(deleteContact(deletedUser.id));
      dispatch(
        AppAlertActions.show({
          severity: "warning",
          alertText: `You have been deleted from user ${deletedUser.name} (ID: ${deletedUser.id})'s contact list.`,
        }),
      );
    }
  });

  socket.on("im/message", async (msg) => {
    const message = {
      status: "succeeded",
      ...msg,
    };

    await dispatch(addMessage(message.senderID, message));
  });

  return socket;
}

export function closeSocket() {
  socket?.close();
  socket = undefined;
}
