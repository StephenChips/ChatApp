import { createContext, useEffect, useRef, useState } from "react"
import { Box, Button, Dialog, DialogContent, DialogTitle, TextField, Tooltip, Typography } from "@mui/material"

import cls from "./App.module.css"
import { AccountInfo } from "./components/AccountInfo/AccountInfo"
import { SearchBox } from "./components/SearchBox/SearchBox"
import { ContactList } from "./components/ContactList/ContactList"
import { MessageWindow } from "./components/MessageWindow/MessageWindow"
import { initializeStore, useAppDispatch, useAppSelector, useAppStore } from "../../store"
import {
  selectAllContacts,
  selectContactByUserID,
  sendMessage,
  setMessageStatus,
  hasContact
} from "../../store/contacts"
import { Contact, Message, User } from "../../store/modeltypes"
import { selectAppUser } from "../../store/appUser"
import { AddContactDialog } from "./components/AddContactDialog/AddContactDialog"

export type MainPageContext = {
  currentContact?: Contact,
  setCurrentContact: (contactUserID: User["id"] | undefined) => void,
  
  isAddContactDialogOpen: boolean,
  openAddContactDialog: () => void,
  closeAddContactDialog: () => void
}

export const MainPageContext = createContext<MainPageContext>({
  currentContact: undefined,
  setCurrentContact() {},
  isAddContactDialogOpen: false,
  openAddContactDialog() {},
  closeAddContactDialog() {}
})

export function App() {
  const dispatch = useAppDispatch()

  const [
    currentContactUserID, setCurrentContactUserID
  ] = useState<User["id"] | undefined>(undefined)
  const [
    isAddContactDialogOpen, setIsAddContactDialogOpen
  ] = useState(false)


  const currentContactUserIDRef = useRef<number | undefined>()
  currentContactUserIDRef.current = currentContactUserID

  const store = useAppStore()
  const appUser = useAppSelector(state => selectAppUser(state))
  const contacts = useAppSelector(state => selectAllContacts(state))
  const currentContact: Contact | undefined = useAppSelector(state => {
    if (currentContactUserID === undefined) return undefined
    else return selectContactByUserID(state, currentContactUserID)
  })

  const context : MainPageContext = {
    currentContact,
    setCurrentContact,
    isAddContactDialogOpen,
    openAddContactDialog,
    closeAddContactDialog
  }

  useEffect(() => {
    dispatch(initializeStore())
  }, [])

  useEffect(() => {
    document.addEventListener("keydown", closeMessageWindowAfterPressingEscape)

    return () => {
      document.removeEventListener("keydown", closeMessageWindowAfterPressingEscape)
    }
  }, [])

  return (
    <MainPageContext.Provider value={context}>
      <div className={cls.app}>
        <div className={cls.sidebar}>
          <div className={cls["contact-title"]}>Contacts</div>
          <button className={cls["add-contact-btn"]} onClick={openAddContactDialog}>
            + Add Contact
          </button>
          <SearchBox />
          <ContactList contacts={contacts} className={cls["contact-list"]} />
          <AccountInfo />
        </div>

        <div className={cls["message-window-wrapper"]}>
          <MessageWindow
            contact={currentContact}
            onSendText={handleSendingText}
            onCloseMessageWindow={() => setCurrentContact(undefined)}
          />
        </div>

        <AddContactDialog />
      </div>
    </MainPageContext.Provider>
  )

  /* FUNCTIONS */

  async function handleSendingText(text: string) {
    const messageID = currentContact!.messages.length
    const message: Message = {
      id: messageID,
      type: "text",
      text,
      senderID: appUser!.id,
      sendTime: new Date().toISOString(),
      status: "sending"
    }

    dispatch(sendMessage({
      contactUserID: currentContact!.user.id,
      message
    }))

    let status: Message["status"] = "succeeded"

    try {
      await sendMessageToServer(message)
    } catch {
      status = "failed"
    }
    dispatch(setMessageStatus({
      contactUserID: currentContact!.user.id,
      messageID,
      status
    }))
  }

  async function sendMessageToServer(message: Message) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 1000)
    })
  }

  function setCurrentContact(contactUserID: User["id"] | undefined) {
    if (contactUserID === currentContactUserIDRef.current) return
    if (contactUserID === undefined) {
      setCurrentContactUserID(undefined)
      return
    }
    if (hasContact(store.getState(), contactUserID)) {
      setCurrentContactUserID(contactUserID)
    }
  }

  function closeMessageWindowAfterPressingEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      console.log(event.key)
      setCurrentContact(undefined)
    }
  }

  function closeAddContactDialog() {
    setIsAddContactDialogOpen(false)
  }

  function openAddContactDialog() {
    setIsAddContactDialogOpen(true)
  }
}
