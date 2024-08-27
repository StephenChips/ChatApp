import { createContext, useEffect, useRef, useState } from "react";
import cls from "./App.module.css";
import { ContactList } from "./components/ContactList/ContactList";
import { useAppDispatch, useAppSelector, useAppStore } from "../../store";
import {
  selectAllContacts,
  selectContactByUserID,
  hasContact,
} from "../../store/contacts";
import { Contact, User } from "../../store/modeltypes";
import { AddContactDialog } from "./components/AddContactDialog/AddContactDialog";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { PersonAdd, AccountCircle, Notifications } from "@mui/icons-material";
import { Outlet, useLocation, useNavigate, type Location } from "react-router";
import {
  NotificationThunks,
  selectNumberOfUnreadNotifications,
} from "../../store/notifications";
import { DeleteUserDialogActions } from "../../store/deleteUserDialog";
import { AppAlert } from "../../components/AppAlert";
import { NavigateEffect } from "../../components/NavigateEffect";
import { selectHasLoggedIn, selectLogInToken } from "../../store/appUser";
import axios from "axios";
import { AppAlertActions } from "../../store/appAlert";

export type MainPageContext = {
  currentContact?: Contact;
  setCurrentContact: (contactUserID: User["id"] | undefined) => void;

  isAddContactDialogOpen: boolean;
  openAddContactDialog: () => void;
  closeAddContactDialog: () => void;
};

export const MainPageContext = createContext<MainPageContext>({
  currentContact: undefined,
  setCurrentContact() {},
  isAddContactDialogOpen: false,
  openAddContactDialog() {},
  closeAddContactDialog() {},
});

function useLocationChange(
  onLocationChange: (
    previousLocation: Location | undefined,
    currentLocation: Location,
  ) => void,
) {
  const previousLocation = useRef<Location | undefined>();
  const location = useLocation();

  useEffect(() => {
    onLocationChange(previousLocation.current, location);
    previousLocation.current = location;
  }, [location, onLocationChange]);
}

export function App() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useLocationChange(async (previousLocation, currentLocation) => {
    if (previousLocation?.pathname === currentLocation?.pathname) return;
    if (previousLocation?.pathname === "/notifications") {
      // When we've left the notification
      dispatch(NotificationThunks.readAll());
    }
  });

  const [currentContactUserID, setCurrentContactUserID] = useState<
    User["id"] | undefined
  >(undefined);
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);

  const currentContactUserIDRef = useRef<User["id"] | undefined>();
  currentContactUserIDRef.current = currentContactUserID;

  const store = useAppStore();

  const hasLoggedIn = useAppSelector((state) => selectHasLoggedIn(state));
  const contacts = useAppSelector((state) => selectAllContacts(state));
  const currentContact: Contact | undefined = useAppSelector((state) => {
    if (currentContactUserID === undefined) return undefined;
    else return selectContactByUserID(state, currentContactUserID);
  });

  const unreadNotificationCount = useAppSelector(
    selectNumberOfUnreadNotifications,
  );

  const context: MainPageContext = {
    currentContact,
    setCurrentContact,
    isAddContactDialogOpen,
    openAddContactDialog,
    closeAddContactDialog,
  };

  useEffect(() => {
    document.addEventListener("keydown", closeMessageWindowAfterPressingEscape);

    return () => {
      document.removeEventListener(
        "keydown",
        closeMessageWindowAfterPressingEscape,
      );
    };
  }, []);

  if (!hasLoggedIn) {
    return <NavigateEffect to="/log-in" replace />;
  }

  return (
    <MainPageContext.Provider value={context}>
      <AppAlert style={{ width: "100%", flex: 0 }} />
      <div className={cls["app"]}>
        <div className={cls["sidebar"]}>
          <Box display="flex" justifyContent="end" m={2} mb={1}>
            <IconButton
              sx={{ mr: "auto" }}
              aria-label="Add Contact"
              title="Add Contact"
              onClick={openAddContactDialog}
            >
              <PersonAdd color="primary" fontSize="small"></PersonAdd>
            </IconButton>
            <IconButton
              aria-label="Account Settings"
              title="Account Settings"
              onClick={() => navigate("/account")}
            >
              <AccountCircle fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="System Notifications"
              title="System Notifications"
              onClick={() => navigate("/notifications")}
            >
              <Badge badgeContent={unreadNotificationCount} color="primary">
                <Notifications fontSize="small" />
              </Badge>
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
  );

  /* FUNCTIONS */

  function setCurrentContact(contactUserID: User["id"] | undefined) {
    if (contactUserID === currentContactUserIDRef.current) return;
    if (contactUserID === undefined) {
      setCurrentContactUserID(undefined);
      return;
    }
    if (hasContact(store.getState(), contactUserID)) {
      setCurrentContactUserID(contactUserID);
    }
  }

  function closeMessageWindowAfterPressingEscape(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setCurrentContact(undefined);
    }
  }

  function closeAddContactDialog() {
    setIsAddContactDialogOpen(false);
  }

  function openAddContactDialog() {
    setIsAddContactDialogOpen(true);
  }
}

function DeleteUserConfirmDialog() {
  const logInToken = useAppSelector((state) => selectLogInToken(state));
  const dispatch = useAppDispatch();
  const dialog = useAppSelector((state) => state.deleteUserDialog);

  if (dialog.status === "hidden") {
    return <Dialog open={false}></Dialog>;
  }

  let dialogActions;
  let informingText;

  if (dialog.status === "visible") {
    dialogActions = (
      <>
        <Button color="warning" onClick={() => confirm(dialog.user)}>
          Delete
        </Button>
        <Button onClick={closeDialog}>Cancel</Button>
      </>
    );
  }

  if (dialog.status === "visible") {
    informingText = (
      <>
        <Typography>
          Are you sure to delete this contact?&nbsp;
          <span style={{ fontWeight: "bold" }}>
            This will delete all messages and is irreversible.
          </span>
        </Typography>
      </>
    );
  }

  return (
    <>
      <Dialog open onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Contact</DialogTitle>
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
                borderRadius: "20px",
              }}
              src={dialog.user.avatarURL}
            />

            <Box fontSize="18px" marginLeft={1}>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                {dialog.user.name}
              </span>
            </Box>
            <Box fontSize="16px" marginLeft={1}>
              #{dialog.user.id}
            </Box>
          </Box>
          {informingText}
        </DialogContent>
        <DialogActions>{dialogActions}</DialogActions>
      </Dialog>
    </>
  );

  async function confirm(user: User) {
    await axios("/api/deleteContact", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + logInToken,
      },
      data: {
        userID: user.id,
      },
    }).catch((error) => {
      dispatch(
        AppAlertActions.show({
          severity: "error",
          alertText: error.message,
        }),
      );
    });

    dispatch(DeleteUserDialogActions.hide());
  }

  function closeDialog() {
    dispatch(DeleteUserDialogActions.hide());
  }
}
