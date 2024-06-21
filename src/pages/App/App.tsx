import { createContext, useEffect, useRef, useState } from "react"
import cls from "./App.module.css"
import { ContactList } from "./components/ContactList/ContactList"
import { initializeStore, useAppDispatch, useAppSelector, useAppStore } from "../../store"
import {
  selectAllContacts,
  selectContactByUserID,
  hasContact,
  deleteContact
} from "../../store/contacts"
import { Contact, User } from "../../store/modeltypes"
import { AddContactDialog } from "./components/AddContactDialog/AddContactDialog"
import { Badge, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material"
import {
  PersonAdd,
  Settings,
  Logout,
  Notifications,
  Check
} from "@mui/icons-material"
import { Outlet, useLocation, useNavigate, type Location } from "react-router"
import { NotificationActions } from "../../store/notifications"
import { DeleteUserDialogActions } from "../../store/deleteUserDialog"

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
        <DeleteUserConfirmDialog />
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

function DeleteUserConfirmDialog() {
  const dispatch = useAppDispatch()
  const dialog = useAppSelector((state) => state.deleteUserDialog)
  const TRANSITION_MS = "300ms"

  if (dialog.status === "hidden") {
    return <Dialog open={false}></Dialog>
  }

  let dialogActions
  let informingText

  if (dialog.status === "confirming") {
    dialogActions = <>
      <Button color="warning" onClick={() => confirm(dialog.user)}>Delete</Button>
      <Button onClick={closeDialog}>Cancel</Button>
    </>
  } else if (dialog.status === "succeeded") {
    dialogActions = <Button onClick={closeDialog}>Close</Button>
  }

  if (dialog.status === "confirming") {
    informingText = <>
      <Typography>
        Are you sure to delete this contact?&nbsp;
        <span style={{ fontWeight: "bold" }}>This will delete all messages and is irreversible.</span>
      </Typography>
    </>
  } else if (dialog.status === "succeeded") {
    informingText = <>
      <Box display="flex" alignItems="center">
        <Check sx={{
          marginRight: 1,
          color: "green"
        }} />
        This user has been deleted from your contact.
      </Box>
    </>
  }

  return (
    <>
      <Dialog
        open
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete Contact
        </DialogTitle>
        <DialogContent>
          <Box
            padding={2}
            display="flex"
            alignItems="center"
            border="1px solid #ddd"
            marginBottom={1}
            marginTop={1}
            borderRadius="9px"
          >
            <img
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "20px"
              }}
              src={dialog.user.avatarURL}
            />

            <Box fontSize="18px" marginLeft={1}>
              <span style={{
                fontSize: "18px",
                fontWeight: "bold"
              }}>{dialog.user.name}</span>
            </Box>
            <Box fontSize="16px" marginLeft={1}>
              #{dialog.user.id}
            </Box>
            <Box marginLeft="auto" fontWeight="bold" color="success.main" sx={{
              opacity: dialog.status === "succeeded" ? "1" : "0",
              transition: `opacity ${TRANSITION_MS}`
            }}>DELETED</Box>
          </Box>
          {informingText}
        </DialogContent>
        <DialogActions>
          {dialogActions}
        </DialogActions>
      </Dialog>
    </>

  )

  function confirm(user: User) {
    // Adds async action here, and pop up alert to inform users
    // that the action is suceeeded or failed.

    dispatch(deleteContact(user.id))
    dispatch(DeleteUserDialogActions.succeeded(user))
  }

  function closeDialog() {
    dispatch(DeleteUserDialogActions.hide())
  }
}
