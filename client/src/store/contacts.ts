import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
  ThunkAction,
  UnknownAction,
} from "@reduxjs/toolkit";
import { RootState } from ".";
import { Contact, Message, User } from "./modeltypes";
import axios from "axios";
import { selectLogInToken } from "./appUser";

function stringCompare(a: string, b: string) {
  if (a < b) return -1;
  else if (a === b) return 0;
  else return 1;
}

const contactsAdapter = createEntityAdapter<Contact, User["id"]>({
  selectId: (contact) => contact.user.id,
  sortComparer: (contact1, contact2) =>
    stringCompare(contact1.user.id, contact2.user.id),
});

const initialState = contactsAdapter.getInitialState();

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    addContact: contactsAdapter.addOne,
    deleteContact: contactsAdapter.removeOne,

    addManyContacts: contactsAdapter.addMany,

    upsertManyContacts: contactsAdapter.upsertMany,

    addMessage(
      state,
      {
        payload: { contactUserID, message },
      }: PayloadAction<{ contactUserID: string; message: Message }>,
    ) {
      const contact = state.entities[contactUserID];
      contact?.messages?.push(message);
    },

    setContactMessages(
      state,
      {
        payload: { contactUserID, messages },
      }: PayloadAction<{ contactUserID: string; messages: Message[] }>,
    ) {
      state.entities[contactUserID].messages = messages;
    },

    setNoMoreMessages(
      state,
      {
        payload: { contactUserID, value },
      }: PayloadAction<{ contactUserID: string; value: boolean }>,
    ) {
      const contact = state.entities[contactUserID];
      contact.noMoreMessages = value;
    },
  },

  extraReducers(builder) {
    builder.addCase("resetState", () => initialState);
  },
});

export const FETCH_LIMITS = 15;

export const {
  deleteContact,
  addContact,
  upsertManyContacts,
  setContactMessages,
  setNoMoreMessages,
} = contactsSlice.actions;

export function addMessage(
  contactUserID: string,
  message: Message,
): ThunkAction<Promise<void>, RootState, unknown, UnknownAction> {
  return async function (dispatch) {
    dispatch(
      contactsSlice.actions.addMessage({
        contactUserID,
        message,
      }),
    );
  };
}

export const {
  selectAll: selectAllContacts,
  selectById: selectContactByUserID,
  selectIds: selectContactsUserIDs,
} = contactsAdapter.getSelectors<RootState>((state) => state.contacts);

export function selectContactChats(
  state: RootState,
  contactUserID: User["id"],
) {
  return selectContactByUserID(state, contactUserID)?.messages;
}

export function selectLastChat(state: RootState, contactUserID: User["id"]) {
  const contact = selectContactByUserID(state, contactUserID);
  return contact?.messages?.[0];
}

export function selectLastChatTime(
  state: RootState,
  contactUserID: User["id"],
) {
  return selectLastChat(state, contactUserID)?.sentAt;
}

export function hasContact(state: RootState, userID: User["id"]) {
  return selectContactByUserID(state, userID) !== undefined;
}

export default contactsSlice.reducer;

export function initContactsStore(): ThunkAction<
  Promise<void>,
  RootState,
  unknown,
  UnknownAction
> {
  return async function (dispatch, getState) {
    const logInToken = selectLogInToken(getState())!;
    const { data: contactUsers } = await axios("/api/getContacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${logInToken}`,
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promises = (contactUsers as any[]).map((contactUser: any) =>
      initContactStates(logInToken, contactUser),
    );
    const contacts = await Promise.all(promises);
    dispatch(upsertManyContacts(contacts));
  };
}

async function initContactStates(
  logInToken: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contactUser: any,
): Promise<Contact> {
  const limit = FETCH_LIMITS;

  const messages = await fetchMessages({
    logInToken,
    contactUserID: contactUser.id,
    offset: 0,
    limit,
  });

  const noMoreMessages = messages.length < limit;

  return {
    user: contactUser,
    messages,
    noMoreMessages,
  };
}

async function fetchMessages({
  logInToken,
  contactUserID,
  offset,
  limit,
}: {
  logInToken: string;
  contactUserID: string;
  offset: number;
  limit: number;
}) {
  const {
    data: { messages },
  } = await axios({
    url: "/api/getContactMessages",
    method: "POST",
    headers: {
      Authorization: `Bearer ${logInToken}`,
    },
    data: {
      contactUserID,
      offset,
      limit,
    },
  });

  return messages;
}
