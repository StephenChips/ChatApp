import { createEntityAdapter, createSlice } from "@reduxjs/toolkit"
import { RootState } from ".."
import { selectUserById } from "../users"

export type Contact = {
  userID: number
  latestChat: string
  latestChatTime: string
}

const contactsAdapter = createEntityAdapter<Contact, number>({
  selectId: (contact) => contact.userID,
  sortComparer: (contact1, contact2) => contact1.userID - contact2.userID
})

const initialState = contactsAdapter.getInitialState(
  {},
  {
    1: {
      userID: 1,
      latestChat: "lorem ipsum",
      latestChatTime: "2024/1/1"
    }
  }
)

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    addContact: contactsAdapter.addOne
  }
})

export const { addContact } = contactsSlice.actions

export const {
  selectAll: selectAllContacts,
  selectById: selectContactsById,
  selectIds: selectContactsIds
} = contactsAdapter.getSelectors<RootState>(state => state.contacts)

export const selectUserByContact = (state: RootState, contact: Contact) =>
    selectUserById(state, contact.userID)

export default contactsSlice.reducer