import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Avatar,
  ListItemAvatar,
  ListItemText,
  Divider,
  ListItemIcon,
  DialogTitle,
  Dialog,
  DialogContent,
  DialogContentText,
  TextField,
  Button,
  DialogActions,
  useMediaQuery,
  Theme,
} from "@mui/material";
import { Close, Logout } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  AppUserThunks,
  AvatarSource,
  selectAppUser,
  selectLogInToken,
} from "../../store/appUser";
import React, { useEffect, useState } from "react";
import { PasswordField } from "../../components/PasswordField";
import { AppAlertActions } from "../../store/appAlert";
import axios from "axios";
import { ChangeAvatarDialog } from "../../components/ChangeAvatarDialog";

export function Account() {
  const isViewportWiderThanSmallBreakpoint = useMediaQuery((theme: Theme) =>
    theme.breakpoints.up("sm"),
  );

  const appUser = useAppSelector(selectAppUser);
  const logInToken = useAppSelector(selectLogInToken);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!appUser) return <></>;

  return (
    <>
      <Box height="60px" bgcolor={"white"}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          margin="0 auto"
          width="95%"
          height="100%"
        >
          <Typography variant="h6">Your Account</Typography>
          <IconButton onClick={() => navigate("/")}>
            <Close />
          </IconButton>
        </Box>
        <Box
          sx={{
            marginTop: isViewportWiderThanSmallBreakpoint ? 4 : 2,
            width: isViewportWiderThanSmallBreakpoint
              ? `500px`
              : "min(95%, 500px)",
            marginX: "auto",
            borderRadius: 2,
            background: (theme: Theme) => theme.palette.background.paper,
          }}
        >
          <List sx={{ width: "100%" }}>
            <ListItem
              sx={{ display: "flex", alignItems: "center", marginY: 2 }}
            >
              <ListItemAvatar sx={{ marginRight: 2, position: "relative" }}>
                <Avatar
                  src={appUser.avatarURL}
                  sx={{ height: 60, width: 60, marginLeft: 1 }}
                />
              </ListItemAvatar>
              <Box>
                <Typography variant="h5" display="flex" alignItems="center">
                  {appUser.name}
                </Typography>
                <Typography variant="body2" color="gray">
                  ChatApp ID:&nbsp;
                  <span style={{ fontWeight: "bold" }}>{appUser.id}</span>
                </Typography>
              </Box>
            </ListItem>
            <Divider sx={{ marginY: 1 }} />
            <ListItemButton onClick={() => setIsChangingUsername(true)}>
              <ListItemText primary="Change Username" />
            </ListItemButton>
            <ListItemButton onClick={() => setIsChangingAvatar(true)}>
              <ListItemText primary="Change Avatar" />
            </ListItemButton>
            <ListItemButton onClick={() => setIsChangingPassword(true)}>
              <ListItemText primary="Change Password" />
            </ListItemButton>
            <ListItemButton
              onClick={() => {
                dispatch(AppUserThunks.logOut(null));
              }}
            >
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Box>
      <ChangeUsernameDialog
        fullScreen={!isViewportWiderThanSmallBreakpoint}
        open={isChangingUsername}
        onSubmit={onSubmitUsernameChanged}
        onClose={() => {
          setIsChangingUsername(false);
        }}
      />
      <ChangePasswordDialog
        fullScreen={!isViewportWiderThanSmallBreakpoint}
        open={isChangingPassword}
        onSubmit={onSubmitPasswordChanged}
        onClose={() => {
          setIsChangingPassword(false);
        }}
      />
      <ChangeAvatarDialog
        fullScreen={!isViewportWiderThanSmallBreakpoint}
        open={isChangingAvatar}
        onSubmit={onSubmitAvatarChanged}
        onClose={() => {
          setIsChangingAvatar(false);
        }}
      ></ChangeAvatarDialog>
    </>
  );

  async function onSubmitUsernameChanged(newUsername: string) {
    setIsChangingUsername(false);

    try {
      await dispatch(AppUserThunks.setUsername(newUsername)).unwrap();
      dispatch(
        AppAlertActions.show({
          alertText: "You username has changed to " + newUsername,
          severity: "success",
        }),
      );
    } catch (e) {
      const error = e as Error;
      dispatch(
        AppAlertActions.show({
          alertText: error.message,
          severity: "error",
        }),
      );
    }
  }

  async function onSubmitPasswordChanged(newPassword: string) {
    setIsChangingPassword(false);
    try {
      await axios("/api/setUserPassword", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${logInToken}`,
        },
        data: { password: newPassword },
      });
      dispatch(
        AppUserThunks.logOut({
          type: "password has changed",
          userID: appUser!.id,
        }),
      );
    } catch {
      dispatch(
        AppAlertActions.show({
          alertText: "Failed to change the password.",
          severity: "error",
        }),
      );
    }
  }

  async function onSubmitAvatarChanged(newAvatarSource: AvatarSource) {
    try {
      await dispatch(AppUserThunks.setUserAvatar(newAvatarSource)).unwrap();
      dispatch(
        AppAlertActions.show({
          alertText: "Your avatar has been changed.",
          severity: "success",
        }),
      );
    } catch (e) {
      const alertText = (e as Error).message;
      dispatch(
        AppAlertActions.show({
          alertText,
          severity: "error",
        }),
      );
      return;
    } finally {
      setIsChangingAvatar(false);
    }
  }
}

function ChangeUsernameDialog({
  open,
  onSubmit: $onSubmit,
  onClose,
  fullScreen,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (newUsername: string) => void;
  fullScreen: boolean;
}) {
  const appUser = useAppSelector(selectAppUser)!;
  const [userNameTextFieldValue, setUsernameTextFieldValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    setUsernameTextFieldValue("");
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        component: "form",
        onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (userNameTextFieldValue === "") {
            setErrorMessage("Please enter a username.");
          } else {
            $onSubmit(userNameTextFieldValue);
          }
        },
      }}
    >
      <DialogTitle>Change Username</DialogTitle>
      <DialogContent>
        <TextField
          error={errorMessage !== ""}
          autoFocus
          id="username"
          name="username"
          label="New Username"
          placeholder="Enter a new username"
          type="text"
          fullWidth
          variant="standard"
          value={userNameTextFieldValue}
          onChange={(event) => {
            setErrorMessage("");
            setUsernameTextFieldValue(event.target.value);
          }}
          helperText={errorMessage}
          margin="normal"
        ></TextField>
        <DialogContentText>
          <Typography variant="body2" component="span">
            Your current username is{" "}
            <span style={{ fontWeight: "bold" }}>{appUser.name}</span>
          </Typography>
        </DialogContentText>
        <DialogActions>
          <Button type="submit" disabled={userNameTextFieldValue === ""}>
            Change
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog({
  open,
  onClose,
  onSubmit: $onSubmit,
  fullScreen,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
  fullScreen: boolean;
}) {
  const [showError, setShowError] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  useEffect(() => {
    if (!open) return;
    setShowError(false);
    setNewPassword("");
    setNewPasswordConfirm("");
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      PaperProps={{
        component: "form",
        onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (newPassword !== newPasswordConfirm) {
            setShowError(true);
            return;
          }
          $onSubmit(newPassword);
        },
      }}
    >
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <PasswordField
          required
          autoFocus
          id="newPassword"
          name="newPassword"
          label="New Password"
          placeholder="Enter a new password"
          fullWidth
          variant="standard"
          value={newPassword}
          onChange={(event) => {
            setShowError(false);
            setNewPassword(event.target.value);
          }}
          margin="normal"
        />
        <PasswordField
          required
          error={showError && newPassword !== newPasswordConfirm}
          autoFocus
          id="newPasswordConfirm"
          name="newPasswordConfirm"
          label="Confirm the new password"
          placeholder="Enter the new password again"
          fullWidth
          variant="standard"
          value={newPasswordConfirm}
          onChange={(event) => {
            setShowError(false);
            setNewPasswordConfirm(event.target.value);
          }}
          helperText={
            showError && newPassword !== newPasswordConfirm
              ? "This password is not matched the new password your entered above."
              : ""
          }
          margin="normal"
        />
        <DialogActions>
          <Button type="submit">Change</Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
