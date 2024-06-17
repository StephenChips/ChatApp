import { createEntityAdapter, createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "."
import { Contact, Message, User } from "./modeltypes"

const contactsAdapter = createEntityAdapter<Contact, number>({
  selectId: (contact) => contact.user.id,
  sortComparer: (contact1, contact2) => contact1.user.id - contact2.user.id
})

const initialState = contactsAdapter.getInitialState()

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    addContact: contactsAdapter.addOne,

    setAllContacts: contactsAdapter.setAll,

    sendMessage(state, actions: PayloadAction<{
      contactUserID: User["id"],
      message: Message
    }>) {
      const { contactUserID, message } = actions.payload
      const contact = state.entities[contactUserID]
      contact?.messages.push(message)
    },

    setMessageStatus(state, actions: PayloadAction<{ contactUserID: User["id"], messageID: Message["id"], status: Message["status"] }>) {
      const { contactUserID, messageID, status } = actions.payload;
      const contact = state.entities[contactUserID]
      const message = contact?.messages.find(msg => msg.id === messageID)
      if (message) {
        message.status = status
      }
    }
  }
})

export const { addContact, setAllContacts, sendMessage, setMessageStatus } = contactsSlice.actions

export const {
  selectAll: selectAllContacts,
  selectById: selectContactByUserID,
  selectIds: selectContactsUserIDs
} = contactsAdapter.getSelectors<RootState>(state => state.contacts)

export function selectLastChat(state: RootState, contactUserID: User["id"]) {
  const contact = selectContactByUserID(state, contactUserID)
  return contact?.messages?.[0]
}

export function selectLastChatTime(state: RootState, contactUserID: User["id"]) {
  return selectLastChat(state, contactUserID)?.sendTime
}

export function hasContact(state: RootState, userID: User["id"]) {
  return selectContactByUserID(state, userID) !== undefined
}


export default contactsSlice.reducer