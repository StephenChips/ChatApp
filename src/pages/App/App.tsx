import { createContext, useEffect, useState } from "react"

import cls from "./App.module.css"
import { AccountInfo } from "./components/AccountInfo/AccountInfo"
import { SearchBox } from "./components/SearchBox/SearchBox"
import { ContactList } from "./components/ContactList/ContactList"
import { MessageWindow } from "./components/MessageWindow/MessageWindow"
import { initializeStore, useAppDispatch, useAppSelector, useAppStore } from "../../store"
import { selectAllContacts, selectContactByUserID, sendMessage, setMessageStatus } from "../../store/contacts"
import { Contact, Message, User } from "../../store/modeltypes"
import { selectAppUser } from "../../store/appUser"

export type MainPageContextType = {
  currentContact?: Contact,
  setCurrentContact: (contactUserID: User["id"]) => void
}

export const MainPageContext = createContext<MainPageContextType>({
  currentContact: undefined,
  setCurrentContact: () => {}
})

export function App() {
  const dispatch = useAppDispatch()

  const [
    currentContactUserID,
    setCurrentContactUserID
  ] = useState<User["id"] | undefined>(undefined)

  const store = useAppStore()
  const appUser = useAppSelector(state => selectAppUser(state))
  const contacts = useAppSelector(state => selectAllContacts(state))
  const currentContact: Contact | undefined = useAppSelector(state => {
    if (currentContactUserID === undefined) return undefined
    else return selectContactByUserID(state, currentContactUserID)
  })

  useEffect(() => {
    dispatch(initializeStore())
  }, [])

  return (
    <MainPageContext.Provider value={{
      currentContact,
      setCurrentContact
    }}>
      <div className={cls.app}>
        <div className={cls.sidebar}>
          <div className={cls["contact-title"]}>Contacts</div>
          <button className={cls["add-contact-btn"]}>+ Add Contact</button>
          <SearchBox />
          <ContactList contacts={contacts} className={cls["contact-list"]} />
          <AccountInfo />
        </div>

        <div className={cls["message-window-wrapper"]}>
          <MessageWindow
            contact={currentContact}
            onSendText={handleSendingText}
          />
        </div>
      </div>
    </MainPageContext.Provider>
  )

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

  function setCurrentContact(contactUserID: User["id"]) {
    if (contactUserID === currentContactUserID) return
    const contact = selectContactByUserID(store.getState(), contactUserID)
    console.log(contactUserID)
    if (!contact) return
    setCurrentContactUserID(contact.user.id)
  }
}
