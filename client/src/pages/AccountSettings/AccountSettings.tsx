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
  styled,
  useMediaQuery,
  Theme,
} from "@mui/material";
import { ArrowForward, Close, Delete, Logout } from "@mui/icons-material";
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

export function Account() {
  const isViewportWiderThanLargeBreakpoint = useMediaQuery((theme: Theme) =>
    theme.breakpoints.up("lg"),
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
            marginTop: isViewportWiderThanLargeBreakpoint ? 4 : 2,
            width: isViewportWiderThanLargeBreakpoint
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
        fullScreen={!isViewportWiderThanLargeBreakpoint}
        open={isChangingUsername}
        onSubmit={onSubmitUsernameChanged}
        onClose={() => {
          setIsChangingUsername(false);
        }}
      />
      <ChangePasswordDialog
        fullScreen={!isViewportWiderThanLargeBreakpoint}
        open={isChangingPassword}
        onSubmit={onSubmitPasswordChanged}
        onClose={() => {
          setIsChangingPassword(false);
        }}
      />
      <ChangeAvatarDialog
        fullScreen={!isViewportWiderThanLargeBreakpoint}
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

function ChangeAvatarDialog({
  open,
  onClose,
  onSubmit: $onSubmit,
  fullScreen,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (newAvatarSource: AvatarSource) => void;
  fullScreen: boolean;
}) {
  const acceptedFileMIME = ["image/png", "image/jpeg"];
  const appUser = useAppSelector(selectAppUser);
  const [uploadErrorString, setUploadErrorString] = useState("");

  const [selectedAvatar, setSelectedAvatar] = useState<AvatarSource | null>(
    null,
  );

  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    objectURL: string;
  } | null>(null);

  const [defaultAvatars, setDefaultAvatars] = useState<string[]>([]);

  useEffect(() => {
    if (open) return;
    // Run this effect when the dialog's closed (or before closing).

    setSelectedAvatar(null);
    deleteUploadedImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    (async () => {
      const imageSources = await fetchDefaultAvatars();
      setDefaultAvatars(imageSources);
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage.objectURL);
    };
  }, [uploadedImage]);

  const avatarElements = defaultAvatars.map((avatarURL, index) => {
    return (
      <AvatarButton
        key={index}
        src={avatarURL}
        isSelected={
          selectedAvatar !== null &&
          selectedAvatar.from === "url" &&
          selectedAvatar.url === avatarURL
        }
        onClick={() => {
          setSelectedAvatar({
            from: "url",
            url: avatarURL,
          });
        }}
      />
    );
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle>Change Avatar</DialogTitle>
      <DialogContent>
        <Box display="flex" justifyContent="space-around" alignItems="center">
          <Box>
            <Avatar
              src={appUser?.avatarURL}
              sx={{ width: 66, height: 66, marginX: "auto", marginBottom: 1 }}
            ></Avatar>
            <Typography variant="body2">Current Avatar</Typography>
          </Box>

          <ArrowForward />
          {selectedAvatar ? (
            (() => {
              const url =
                selectedAvatar.from === "url"
                  ? selectedAvatar.url
                  : uploadedImage!.objectURL;

              return (
                <Box>
                  <Avatar
                    src={url}
                    sx={{
                      width: 66,
                      height: 66,
                      marginX: "auto",
                      marginBottom: 1,
                    }}
                  ></Avatar>
                  <Typography variant="body2">New Avatar</Typography>
                </Box>
              );
            })()
          ) : (
            <Typography variant="body2" textAlign="center">
              New Avatar <br />
              (You haven't select one yet.)
            </Typography>
          )}
        </Box>
        <DialogContentText marginTop={2}>Default Avatars</DialogContentText>
        <Box
          display="flex"
          gap="15px"
          marginTop={1}
          marginX="auto"
          flexWrap="wrap"
        >
          {avatarElements}
        </Box>
        <DialogContentText marginTop={3}>
          {uploadedImage ? "Uploaded Image" : "Upload"}
        </DialogContentText>
        {uploadedImage ? (
          <Box
            sx={{
              padding: 2,
              marginTop: 2,
              backgroundColor: "#EFEFEF",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "150px",
              marginX: "auto",
            }}
          >
            <Box marginRight={1}>
              <AvatarButton
                src={uploadedImage.objectURL}
                onClick={() =>
                  setSelectedAvatar({
                    from: "uploaded-image",
                    imageFile: uploadedImage.file,
                  })
                }
                isSelected={
                  selectedAvatar !== null &&
                  selectedAvatar.from === "uploaded-image"
                }
              />
            </Box>
            <IconButton onClick={deleteUploadedImage}>
              <Delete />
            </IconButton>
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "150px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 3,
              borderStyle: "dashed",
              borderColor: "primary.main",
              borderWidth: 3,
              boxSizing: "border-box",
              marginTop: 1,
            }}
          >
            <Box>
              Drop your image file here or
              <Button
                variant="outlined"
                component="label"
                sx={{ marginLeft: 1 }}
              >
                UPLOAD
                <VisuallyHiddenInput
                  type="file"
                  accept={acceptedFileMIME.join(",")}
                  onChange={onFileUploaded}
                />
              </Button>
              <Typography
                variant="body2"
                color="red"
                marginTop={2}
                display={uploadErrorString === "" ? "none" : "block"}
              >
                {uploadErrorString}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClickChangeAvatarButton}
          disabled={selectedAvatar === null}
        >
          Change
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  async function onClickChangeAvatarButton() {
    if (!selectedAvatar) return;

    $onSubmit(selectedAvatar);
  }

  function onFileUploaded(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.item(0);

    if (!file) {
      setUploadErrorString("You didn't select a file to upload");
      return;
    }

    if (!acceptedFileMIME.includes(file.type)) {
      setUploadErrorString("Please select a JPEG or a PNG image to upload.");
      return;
    }

    setSelectedAvatar({ from: "uploaded-image", imageFile: file });

    setUploadedImage({
      file,
      objectURL: URL.createObjectURL(file),
    });
  }

  function deleteUploadedImage() {
    if (!uploadedImage) return;
    URL.revokeObjectURL(uploadedImage.objectURL);
    setUploadedImage(null);
    setSelectedAvatar(null);
  }
}

// A hidden input for providing file uploading and is designed to be
// called by other components or HTML elements.
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

function AvatarButton({
  onClick,
  isSelected,
  src,
}: {
  onClick: () => void;
  isSelected: boolean;
  src: string;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "6px",
        width: "66px",
        height: "66px",
        borderWidth: isSelected ? "3px" : 0,
        borderStyle: "solid",
        borderColor: isSelected ? "primary.main" : undefined,
        borderRadius: "33px",
        boxSizing: "border-box",
        cursor: "pointer",
        background: "white",
        transition: "border-width 100ms ease-in-out",
      }}
    >
      <Avatar
        src={src}
        sx={{
          width: "100%",
          height: "100%",
        }}
      ></Avatar>
    </Box>
  );
}

async function fetchDefaultAvatars() {
  type Response = { url: string }[];
  const response = await axios.post<Response>("/api/getDefaultAvatars");
  return response.data.map(({ url }) => url);
}
