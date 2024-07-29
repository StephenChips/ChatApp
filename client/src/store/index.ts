import { configureStore, ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import contactsReducer, { initContactsStore } from "./contacts";
import appUsersReducer, { AppUserThunks, selectLogInToken } from "./appUser";
import notificationsReducer, { NotificationThunks } from "./notifications";
import deleteUserDialogReducer from "./deleteUserDialog";
import appAlertReducer from "./appAlert";
import { useDispatch, useSelector, useStore } from "react-redux";
import { Contact } from "./modeltypes";
import { initSocket } from "../socket";

export const store = configureStore({
  reducer: {
    contacts: contactsReducer,
    appUser: appUsersReducer,
    notifications: notificationsReducer,
    deleteUserDialog: deleteUserDialogReducer,
    appAlert: appAlertReducer,
  },
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();

export function fetchContactsWithMessages(): Contact[] {
  return [
    {
      user: {
        id: "1",
        name: "John",
        avatarURL:
          "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E",
      },
      messages: [],
    },
    {
      user: {
        id: "2",
        name: "Jack",
        avatarURL:
          "https://fastly.picsum.photos/id/174/50/50.jpg?hmac=mW6r1Zub6FvIFJsQBfPRVHD6r1n980M8y7kpNQ3scFI",
      },
      messages: [],
    },
    {
      user: {
        id: "3",
        name: "Paul",
        avatarURL:
          "https://fastly.picsum.photos/id/649/50/50.jpg?hmac=1DvRtR-LwNXehtjiit4CTZU6D6nXcN_aI6TqMwkw8PU",
      },
      messages: [],
    },
  ];
}

export function initAppStore(): ThunkAction<Promise<void>, RootState, unknown, UnknownAction> {
  return async function (dispatch, getState) {
    // Set the login token from the local/sessionStorage (if exists).
    await dispatch(AppUserThunks.initStore());

    // If we find a login token, we should load data that need login.
    const logInToken = selectLogInToken(getState());
    if (logInToken !== null) {
      await dispatch(NotificationThunks.initStore());
      await dispatch(initContactsStore());
      initSocket({ logInToken, dispatch: store.dispatch });
    }
  };
}

