import { differenceInMilliseconds } from "date-fns";
import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { Notification } from "./modeltypes";
import { RootState } from ".";

const notificationAdapter = createEntityAdapter<Notification>({
  sortComparer: (n1, n2) =>
    differenceInMilliseconds(n1.creationTime, n2.creationTime),
});

const initialState = notificationAdapter.getInitialState({
  unreadNotificationIDs: {} as number[],
  newNotificationIDs: {} as number[],
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    initialze(
      state,
      {
        payload,
      }: PayloadAction<{
        notifications: Notification[];
        unreadNotificationIDs: number[];
        newNotificationIDs: number[];
      }>,
    ) {
      notificationAdapter.setAll(state, payload.notifications);
      state.unreadNotificationIDs = payload.unreadNotificationIDs;
      state.newNotificationIDs = payload.newNotificationIDs;
    },
    setOne: notificationAdapter.setOne,
    readAll(state) {
      state.unreadNotificationIDs = [];
    },
    clearNew(state) {
      state.newNotificationIDs = [];
    },
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

export function isNotificationNew(
  state: RootState,
  notification: Notification,
) {
  return state.notifications.newNotificationIDs.includes(notification.id);
}

export default notificationSlice.reducer;
