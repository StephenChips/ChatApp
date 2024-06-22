import { configureStore, ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import contactsReducer, { setAllContacts } from "./contacts";
import appUsersReducer from "./appUser";
import notificationsReducer, { NotificationActions } from "./notifications";
import deleteUserDialog from "./deleteUserDialog";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Contact, Notification } from "./modeltypes";

export const store = configureStore({
  reducer: {
    contacts: contactsReducer,
    appUser: appUsersReducer,
    notifications: notificationsReducer,
    deleteUserDialog: deleteUserDialog,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

let storeHasInitialized = false;

export function fetchContactsWithMessages(): Contact[] {
  return [
    {
      user: {
        id: 1,
        name: "John",
        avatarURL:
          "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E",
      },
      messages: [],
    },
    {
      user: {
        id: 2,
        name: "Jack",
        avatarURL:
          "https://fastly.picsum.photos/id/174/50/50.jpg?hmac=mW6r1Zub6FvIFJsQBfPRVHD6r1n980M8y7kpNQ3scFI",
      },
      messages: [],
    },
    {
      user: {
        id: 3,
        name: "Paul",
        avatarURL:
          "https://fastly.picsum.photos/id/649/50/50.jpg?hmac=1DvRtR-LwNXehtjiit4CTZU6D6nXcN_aI6TqMwkw8PU",
      },
      messages: [],
    },
  ];
}

async function fetchNotifications(): Promise<Notification[]> {
  return [
    {
      id: 0,
      type: "add contact request",
      creationTime: "2020/3/3 11:33:10",
      request: {
        id: 0,
        fromUser: {
          id: 0,
          name: "Jack",
          avatarURL:
            "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E",
        },
        toUser: {
          id: 1,
          name: "John",
          avatarURL:
            "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E",
        },
        requestStatus: "expired",
      },
    },
    {
      id: 1,
      type: "add contact request",
      creationTime: "2020/3/4 13:10:42",
      request: {
        id: 0,
        fromUser: {
          id: 1,
          name: "John",
          avatarURL:
            "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E",
        },
        toUser: {
          id: 0,
          name: "Jack",
          avatarURL:
            "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E",
        },
        requestStatus: "pending",
      },
    },
  ];
}

export function initializeStore(): ThunkAction<
  void,
  RootState,
  unknown,
  UnknownAction
> {
  return async function (dispatch) {
    if (storeHasInitialized) return;

    const contacts = await fetchContactsWithMessages();
    const notifications = await fetchNotifications();

    dispatch(setAllContacts(contacts));
    dispatch(
      NotificationActions.initialze({
        notifications,
        unreadNotificationIDs: notifications.map(
          (notifications) => notifications.id,
        ),
        newNotificationIDs: notifications.map(
          (notifications) => notifications.id,
        ),
      }),
    );

    storeHasInitialized = true;
  };
}
