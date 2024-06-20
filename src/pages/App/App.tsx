import { createContext, useEffect, useRef, useState } from "react"
import cls from "./App.module.css"
import { ContactList } from "./components/ContactList/ContactList"
import { initializeStore, useAppDispatch, useAppSelector, useAppStore } from "../../store"
import {
  selectAllContacts,
  selectContactByUserID,
  hasContact
} from "../../store/contacts"
import { Contact, User } from "../../store/modeltypes"
import { AddContactDialog } from "./components/AddContactDialog/AddContactDialog"
import { Badge, Box, IconButton } from "@mui/material"
import {
  PersonAdd,
  Settings,
  Logout,
  Notifications
} from "@mui/icons-material"
import { Outlet, useLocation, useNavigate, type Location } from "react-router"
import { NotificationActions } from "../../store/notifications"

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

function useLocationChange(onLocationChange: (previousLocation: Location | undefined, currentLocation: Location) => void) {
  const previousLocation = useRef<Location | undefined>()
  const location = useLocation()

  useEffect(() => {
    onLocationChange(previousLocation.current, location)
    previousLocation.current = location
  }, [location, onLocationChange])
}

export function App() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  useLocationChange((previousLocation, currentLocation) => {
    if (previousLocation?.pathname === currentLocation?.pathname) return
    if (previousLocation?.pathname === "/notifications") {
      // When we've left the notification 
      dispatch(NotificationActions.clearNew())
    } else if (currentLocation.pathname === "/notifications") {
      // When we've entered the notification page
      dispatch(NotificationActions.readAll())
    }
  })

  const [
    currentContactUserID, setCurrentContactUserID
  ] = useState<User["id"] | undefined>(undefined)
  const [
    isAddContactDialogOpen, setIsAddContactDialogOpen
  ] = useState(false)

  const currentContactUserIDRef = useRef<number | undefined>()
  currentContactUserIDRef.current = currentContactUserID

  const store = useAppStore()
  const contacts = useAppSelector(state => selectAllContacts(state))
  const currentContact: Contact | undefined = useAppSelector(state => {
    if (currentContactUserID === undefined) return undefined
    else return selectContactByUserID(state, currentContactUserID)
  })

  const numberOfUnreadNotifications = useAppSelector((state) => {
    return state.notifications.unreadNotificationIDs.length
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

  return (
    <MainPageContext.Provider value={context}>
      <div className={cls["app"]}>
        <div className={cls["sidebar"]}>
          <Box
            display="flex"
            justifyContent="end"
            m={2}
            mb={1}
          >
            <IconButton sx={{ mr: "auto" }} aria-label="Add Contact" title="Add Contact" onClick={openAddContactDialog}>
              <PersonAdd color="primary" fontSize="small"></PersonAdd>
            </IconButton>
            <IconButton aria-label="System Notifications" title="System Notifications" onClick={() => navigate("/notifications")}>
              <Badge badgeContent={numberOfUnreadNotifications} color="primary">
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
          <ContactList contacts={contacts} className={cls["contact-list"]} />
        </div>

        <Box className={cls["router-outlet-wrapper"]}>
          <Outlet />
        </Box>
        <AddContactDialog />
      </div>
    </MainPageContext.Provider>
  )

  /* FUNCTIONS */

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

