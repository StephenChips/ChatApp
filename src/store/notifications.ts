import { differenceInMilliseconds } from "date-fns"
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { Notification } from "./modeltypes"
import { RootState } from ".";

const notificationAdapter = createEntityAdapter<Notification>({
  sortComparer: (n1, n2) => differenceInMilliseconds(n1.creationTime, n2.creationTime),
})

const initialState = notificationAdapter.getInitialState()

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    addOneNotification: notificationAdapter.addOne,
    addManyNotifications: notificationAdapter.addMany,
    setAllNotifications: notificationAdapter.setAll,
    setOneNotification: notificationAdapter.setOne,
    removeAllNotifications: notificationAdapter.removeAll,
    removeOneNotification: notificationAdapter.removeOne
  }
})

export const {
  addOneNotification,
  addManyNotifications,
  removeAllNotifications,
  removeOneNotification,
  setAllNotifications,
  setOneNotification,
} = notificationSlice.actions

export const {
  selectAll: selectAllNotifications,
  selectById: selectNotificationByID,
  selectEntities: selectNotificationEntities,
  selectIds: selectNotificationIDs,
  selectTotal: selectTotalOfNotifications
} = notificationAdapter.getSelectors<RootState>(state => state.notifications)

export default notificationSlice.reducer