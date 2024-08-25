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
      contact?.messages.push(message);
    },
  },

  extraReducers(builder) {
    builder.addCase("resetState", () => initialState);
  },
});

export const { deleteContact, addContact, upsertManyContacts } =
  contactsSlice.actions;

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

    if (logInToken === null) return;
    
    const { data: contactUsers } = await axios("/api/getContacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${logInToken}`,
      },
    });

    const contactPromises = [];

    for (const contactUser of contactUsers) {
      const promise = axios({
        method: "POST",
        url: "/api/getContactMessages",
        headers: {
          Authorization: `Bearer ${logInToken}`,
        },
        data: {
          contactUserID: contactUser.id,
        },
      }).then((response) => {
        return {
          user: contactUser,
          messages: response.data.messages,
        }
      });

      contactPromises.push(promise);
    }

    const contacts = await Promise.all(contactPromises);
    dispatch(upsertManyContacts(contacts));
  };
}
