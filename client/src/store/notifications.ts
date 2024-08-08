import { differenceInMilliseconds } from "date-fns";
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
  ThunkAction,
  UnknownAction,
} from "@reduxjs/toolkit";
import { Notification } from "./modeltypes";
import { RootState } from ".";
import axios, { AxiosError } from "axios";
import { selectLogInToken } from "./appUser";
import { countIf } from "../utils";

const notificationAdapter = createEntityAdapter<Notification>({
  sortComparer: (n1, n2) =>
    differenceInMilliseconds(n2.createdAt, n1.createdAt),
});

const initialState = notificationAdapter.getInitialState();

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    upsertOne: notificationAdapter.upsertOne,
    setOne: notificationAdapter.setOne,
    upsertMany(
      state,
      { payload: notification }: PayloadAction<Notification[]>,
    ) {
      notificationAdapter.upsertMany(state, notification);
    },
    readAll(state) {
      for (const id of state.ids) {
        state.entities[id].hasRead = true;
      }
    },
    addOne(state, { payload: notification }: PayloadAction<Notification>) {
      notificationAdapter.addOne(state, notification);
    },
    addMany(state, { payload: notifications }: PayloadAction<Notification[]>) {
      notificationAdapter.addMany(state, notifications);
    },
  },

  extraReducers(builder) {
    builder.addCase("resetState", () => initialState);
  },
});

export const NotificationActions = notificationSlice.actions;

export const {
  selectAll: selectAllNotifications,
  selectById: selectNotificationByID,
  selectEntities: selectNotificationEntities,
  selectIds: selectNotificationIDs,
  selectTotal: selectTotalOfNotifications,
} = notificationAdapter.getSelectors<RootState>((state) => state.notifications);

export function selectNumberOfUnreadNotifications(state: RootState) {
  return countIf(
    state.notifications.ids,
    (id) => !state.notifications.entities[id].hasRead,
  );
}

export default notificationSlice.reducer;

export const NotificationThunks = {
  readAll(): ThunkAction<Promise<void>, RootState, unknown, UnknownAction> {
    return async function (dispatch, getState) {
      const numbersOfNotifications = selectTotalOfNotifications(getState());
      if (numbersOfNotifications === 0) return;

      const logInToken = selectLogInToken(getState());
      const data = selectAllNotifications(getState())
        .filter((notification) => !notification.hasRead)
        .map((notification) => ({
          id: notification.id,
          hasRead: true,
        }));

      try {
        await axios("/api/setNotificationHasRead", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${logInToken}`,
          },
          data,
        });
      } catch (e) {
        const error = e as AxiosError;
        throw error.response?.data;
      }

      dispatch(notificationSlice.actions.readAll());
    };
  },

  initStore(): ThunkAction<Promise<void>, RootState, unknown, UnknownAction> {
    return async function (dispatch, getState) {
      const logInToken = selectLogInToken(getState());

      try {
        const { data: notifications } = await axios("/api/getNotifications", {
          method: "POST",
          headers: {
            Authorization:
              logInToken === null ? undefined : `Bearer ${logInToken}`,
          },
        });

        dispatch(NotificationActions.upsertMany(notifications));
      } catch (e) {
        const error = e as AxiosError;
        throw error.response?.data;
      }
    };
  },
};
