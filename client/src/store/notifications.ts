import { differenceInMilliseconds } from "date-fns";
import {
  createEntityAdapter,
  createSlice,
  ThunkAction,
  UnknownAction,
} from "@reduxjs/toolkit";
import { Notification, User } from "./modeltypes";
import { RootState } from ".";
import axios, { AxiosError } from "axios";
import { selectLogInToken } from "./appUser";

class IntegerGenerator {
  private _val = 0;

  public next(): number {
    return this._val++;
  }
}

export const idGenerator = new IntegerGenerator();

const notificationAdapter = createEntityAdapter<Notification>({
  sortComparer: (n1, n2) =>
    differenceInMilliseconds(n1.createdAt, n2.createdAt),
});

const initialState = notificationAdapter.getInitialState({
  unreadNotificationIDs: [] as number[],
  newNotificationIDs: [] as number[],
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    upsertOne: notificationAdapter.upsertOne,
    setOne: notificationAdapter.setOne,
    upsertMany: notificationAdapter.upsertMany,
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

export const NotificationThunks = {
  initStore(): ThunkAction<
    Promise<void>,
    RootState,
    unknown,
    UnknownAction
  > {
    return async function (dispatch, getState) {
      const logInToken = selectLogInToken(getState());

      try {
        const response = await axios("/api/getAddContactRequests", {
          method: "POST",
          headers: {
            Authorization:
              logInToken === null ? undefined : `Bearer ${logInToken}`,
          },
        });

        const addContactRequests = response.data as unknown[];
        const usersMap = await fetchUsers(addContactRequests);
        const notifications = addContactRequests.map((request) =>
          toNotification(request, usersMap),
        );

        dispatch(NotificationActions.upsertMany(notifications));
      } catch (e) {
        const error = e as AxiosError;
        throw error.response?.data;
      }
    };
  },
};

async function fetchUsers(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addContactRequests: any[],
): Promise<Map<string, User>> {
  const usersMap = new Map<User["id"], User>();
  const userIDSet = new Set<User["id"]>();
  const promises: Promise<void>[] = [];

  for (const acr of addContactRequests) {
    for (const idKey of ["requesterID", "recipientID"]) {
      const id = acr[idKey];
      if (userIDSet.has(id)) continue;
      userIDSet.add(id);
      const promise = axios
        .post("/api/getUserPublicInfo", { id })
        .then((response) => {
          usersMap.set(id, response.data);
        });
      promises.push(promise);
    }
  }

  await Promise.all(promises);

  return usersMap;
}

function toNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addContactRequest: any,
  usersMap: Map<User["id"], User>,
): Notification {
  return {
    id: idGenerator.next(),
    type: "add contact request",
    createdAt: addContactRequest.createdAt,
    request: {
      fromUser: usersMap.get(addContactRequest.requesterID)!,
      toUser: usersMap.get(addContactRequest.recipientID)!,
      requestStatus: addContactRequest.status,
    },
  };
}
