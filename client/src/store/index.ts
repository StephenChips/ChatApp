import { configureStore, ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import contactsReducer, { initContactsStore } from "./contacts";
import appUsersReducer, { AppUserThunks, selectLogInToken } from "./appUser";
import notificationsReducer, { NotificationThunks } from "./notifications";
import deleteUserDialogReducer from "./deleteUserDialog";
import appAlertReducer from "./appAlert";
import { useDispatch, useSelector, useStore } from "react-redux";
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

export function initAppStore(): ThunkAction<Promise<void>, RootState, unknown, UnknownAction> {
  return async function (dispatch, getState) {
    // Set the login token from the local/sessionStorage (if exists).
    await dispatch(AppUserThunks.initStore());

    // If we find a login token, we should load data that need login.
    const logInToken = selectLogInToken(getState());
    if (logInToken !== null) {
      await dispatch(NotificationThunks.initStore());
      await dispatch(initContactsStore());
      initSocket({ logInToken, dispatch: store.dispatch, getState: store.getState });
    }
  };
}

