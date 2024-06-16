import { createContext, useEffect, useRef, useState } from "react"
import cls from "./App.module.css"
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
import { Badge, Box, IconButton } from "@mui/material"
import {
  PersonAdd,
  Settings,
  Logout,
  Notifications
} from "@mui/icons-material"

export type MainPageContext = {
  currentContact?: Contact,
  setCurrentContact: (contactUserID: User["id"] | undefined) => void,

  isAddContactDialogOpen: boolean,
  openAddContactDialog: () => void,
  closeAddContactDialog: () => void
}

export const MainPageContext = createContext<MainPageContext>({
  currentContact: undefined,
  setCurrentContact() { },
  isAddContactDialogOpen: false,
  openAddContactDialog() { },
  closeAddContactDialog() { }
})

type Notification = 
  | {
      type: "send add contact request",
      toUser: User,
      creationTime: Date,
      requestStatus: "agreed" | "rejected" | "pending" | "expired"
    }
  | {
      type: "receive add contact request",
      fromUser: User,
      creationTime: Date,
      requestStatus: "agreed" | "rejected" | "pending" | "expired"
    }

async function fetchNotifications(): Promise<Notification[]> {
  return [
    {
      type: "send add contact request",
      toUser: {
        id: 1,
        name: "John",
        avatarURL: "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E"
      },
      creationTime: new Date("2020/3/3 11:33:10"),
      requestStatus: "pending"
    },
    {
      type: "receive add contact request",
      fromUser: {
        id: 1,
        name: "John",
        avatarURL: "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E"
      },
      creationTime: new Date("2020/3/4 12:10:42"),
      requestStatus: "pending"
    }
  ]
}

export function App() {
  const dispatch = useAppDispatch()

  const [
    currentContactUserID, setCurrentContactUserID
  ] = useState<User["id"] | undefined>(undefined)
  const [
    isAddContactDialogOpen, setIsAddContactDialogOpen
  ] = useState(false)

  const [notificationList, setNotificationList] = useState<Notification[]>([])

  const currentContactUserIDRef = useRef<number | undefined>()
  currentContactUserIDRef.current = currentContactUserID

  const store = useAppStore()
  const appUser = useAppSelector(state => selectAppUser(state))
  const contacts = useAppSelector(state => selectAllContacts(state))
  const currentContact: Contact | undefined = useAppSelector(state => {
    if (currentContactUserID === undefined) return undefined
    else return selectContactByUserID(state, currentContactUserID)
  })

  const context: MainPageContext = {
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

  useEffect(() => {
    (async () => {
      const notifications = await fetchNotifications()
      setNotificationList(notifications)
    })()
  }, [])

  return (
    <MainPageContext.Provider value={context}>
      <div className={cls["app"]}>
        <div className={cls["sidebar"]}>

          <ContactList contacts={contacts} className={cls["contact-list"]} />
          <Box
            display="flex"
            justifyContent="end"
            m={2}
            mb={1}
          >
            <IconButton sx={{ mr: "auto"}} aria-label="Add Contact" title="Add Contact" onClick={openAddContactDialog}>
              <PersonAdd color="primary" fontSize="small"></PersonAdd>
            </IconButton>
            <IconButton aria-label="System Notifications" title="System Notifications">
              <Badge color="secondary" badgeContent={notificationList.length}>
                <Notifications fontSize="small" />
              </Badge>
            </IconButton>
            <IconButton aria-label="Settings" title="Settings">
              <Settings fontSize="small" />
            </IconButton>
            <IconButton aria-label="Logout" title="Logout">
              <Logout fontSize="small" />
            </IconButton>
          </Box>
        </div>

        <Box
          className={cls["message-window-wrapper"]}
        >
          <MessageWindow
            contact={currentContact}
            onSendText={handleSendingText}
            onCloseMessageWindow={() => setCurrentContact(undefined)}
          />
        </Box>
        <AddContactDialog />
      </div>
    </MainPageContext.Provider >
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
