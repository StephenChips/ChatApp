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
import { selectAppUser, selectLogInToken } from "./appUser";
import { ObjectStore, openIndexedDB } from "../indexedDB";

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

    addMessage(
      state,
      {
        payload: { contactUserID, message },
      }: PayloadAction<{ contactUserID: string; message: Message }>,
    ) {
      const contact = state.entities[contactUserID];
      contact?.messages.push(message);
    },

    setMessageStatus(
      state,
      actions: PayloadAction<{
        contactUserID: User["id"];
        messageID: Message["id"];
        status: Message["status"];
      }>,
    ) {
      const { contactUserID, messageID, status } = actions.payload;
      const contact = state.entities[contactUserID];
      const message = contact?.messages.find((msg) => msg.id === messageID);
      if (message) {
        message.status = status;
      }
    },
  },

  extraReducers(builder) {
    builder.addCase("resetState", () => initialState);
  },
});

export const { deleteContact, addContact, addManyContacts } =
  contactsSlice.actions;

export function addMessage(
  contactUserID: string,
  messageWithoutID: Omit<Message, "id">,
): ThunkAction<Promise<number>, RootState, unknown, UnknownAction> {
  return async function (dispatch, getState) {
    const appUser = selectAppUser(getState())!;
    const database = await openIndexedDB();
    const transaction = database.transaction(
      ObjectStore.ChatMessage,
      "readwrite",
    );
    
    const chatMessageStore = transaction.objectStore(ObjectStore.ChatMessage);
    
    const id = (await chatMessageStore.add({
      ...messageWithoutID,
      appUserID: appUser!.id,
      contactUserID,
    })) as number;

    dispatch(
      contactsSlice.actions.addMessage({
        contactUserID,
        message: { id, ...messageWithoutID } as Message,
      }),
    );

    return id;
  };
}

export function setMessageStatus(
  id: number,
  status: Message["status"],
): ThunkAction<Promise<void>, RootState, unknown, UnknownAction> {
  return async function (dispatch) {
    const database = await openIndexedDB();
    const transaction = database.transaction(
      ObjectStore.ChatMessage,
      "readwrite",
    );
    const chatMessageStore = transaction.objectStore(ObjectStore.ChatMessage);
    const message = await chatMessageStore.get(id);
    const newMessage = { ...message, status };
    console.log(newMessage);
    await chatMessageStore.put(newMessage);
    dispatch(
      contactsSlice.actions.setMessageStatus({
        contactUserID: newMessage.recipientID,
        messageID: newMessage.id,
        status,
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
    const loggedInUser = selectAppUser(getState())!;
    if (logInToken === null) return;
    const { data: contactUsers } = await axios("/api/getContacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${logInToken}`,
      },
    });

    const contacts: Contact[] = [];

    const database = await openIndexedDB();

    const transaction = database.transaction(ObjectStore.ChatMessage);
    const chatMessageStore = transaction.objectStore(ObjectStore.ChatMessage);
    for (const contactUser of contactUsers) {
      console.log([loggedInUser.id, contactUser.id])
      const messages = await chatMessageStore
        .index("appUserID, contactUserID")
        .getAll([loggedInUser.id, contactUser.id]);
      contacts.push({
        user: contactUser,
        messages,
      });
    }

    console.log(contacts);

    dispatch(addManyContacts(contacts));
  };
}
