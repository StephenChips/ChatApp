import {
  Box,
  Typography,
  IconButton,
  Paper,
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
} from "@mui/material";
import { ArrowForward, Close, Delete, Logout } from "@mui/icons-material";
import { useNavigate } from "react-router";
import { useAppSelector } from "../../store";
import { selectAppUser } from "../../store/appUser";
import { useEffect, useState } from "react";

import avatar1 from "../../assets/avatar1.svg";
import avatar2 from "../../assets/avatar2.svg";
import avatar3 from "../../assets/avatar3.svg";
import avatar4 from "../../assets/avatar4.svg";
import avatar5 from "../../assets/avatar5.svg";
import avatar6 from "../../assets/avatar6.svg";
import avatar7 from "../../assets/avatar7.svg";

export function Account() {
  const appUser = useAppSelector(selectAppUser)!;
  const navigate = useNavigate();

  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
        <Box marginTop={4} width="75%" marginX="auto">
          <Paper>
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
              <ListItemButton onClick={logout}>
                <ListItemIcon>
                  <Logout />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </List>
          </Paper>
        </Box>
      </Box>
      <ChangeUsernameDialog
        open={isChangingUsername}
        onSubmit={onSubmitUsernameChanged}
        onClose={() => {
          setIsChangingUsername(false);
        }}
      />
      <ChangePasswordDialog
        open={isChangingPassword}
        onSubmit={onSubmitPasswordChanged}
        onClose={() => {
          setIsChangingPassword(false);
        }}
      />
      <ChangeAvatarDialog
        open={isChangingAvatar}
        onSubmit={onSubmitAvatarChanged}
        onClose={() => {
          setIsChangingAvatar(false);
        }}
      ></ChangeAvatarDialog>
    </>
  );

  function logout() {
    // add logout logic here
    navigate("/login");
  }

  function onSubmitUsernameChanged(newUsername: string) {
    setIsChangingUsername(false);
  }

  function onSubmitPasswordChanged(newPassword: string) {
    setIsChangingPassword(false);
  }

  function onSubmitAvatarChanged(newAvatar: string | File) {
    setIsChangingAvatar(false);
  }
}

function ChangeUsernameDialog({
  open,
  onSubmit: $onSubmit,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (newUsername: string) => void;
}) {
  const appUser = useAppSelector(selectAppUser)!;
  const [userNameTextFieldValue, setUserNameTextFieldValue] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    setUserNameTextFieldValue("");
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
            console.log(event.target.value);
            setErrorMessage("");
            setUserNameTextFieldValue(event.target.value);
          }}
          helperText={errorMessage}
          margin="normal"
        ></TextField>
        <DialogContentText>
          <Typography variant="body2">
            Your current username is{" "}
            <span style={{ fontWeight: "bold" }}>{appUser.name}</span>
          </Typography>
        </DialogContentText>
        <DialogActions>
          <Button type="submit">Change</Button>
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
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
}) {
  const [showError, setShowError] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  useEffect(() => {
    if (!open) return;
    setShowError(false);
    setNewPassword("");
    setOldPassword("");
    setNewPasswordConfirm("");
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
        <TextField
          required
          id="oldPassword"
          name="oldPassword"
          label="Old Password"
          placeholder="Enter the old password"
          type="password"
          fullWidth
          variant="standard"
          value={oldPassword}
          onChange={(event) => {
            setShowError(false);
            setOldPassword(event.target.value);
          }}
          margin="normal"
        ></TextField>
        <TextField
          required
          autoFocus
          id="newPassword"
          name="newPassword"
          label="New Password"
          placeholder="Enter a new password"
          type="password"
          fullWidth
          variant="standard"
          value={newPassword}
          onChange={(event) => {
            setShowError(false);
            setNewPassword(event.target.value);
          }}
          margin="normal"
        ></TextField>
        <TextField
          error={showError && newPassword !== oldPassword}
          autoFocus
          id="newPasswordConfirm"
          name="newPasswordConfirm"
          label="Confirm the new password"
          placeholder="Enter the new password again"
          type="password"
          fullWidth
          variant="standard"
          value={newPasswordConfirm}
          onChange={(event) => {
            setShowError(false);
            setNewPasswordConfirm(event.target.value);
          }}
          helperText={
            showError && newPassword !== oldPassword
              ? "This password is not matched the new password your entered above."
              : ""
          }
          margin="normal"
        ></TextField>
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
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
}) {
  const acceptedFileMIME = ["image/png", "image/jpeg"];
  const appUser = useAppSelector(selectAppUser);
  const [uploadErrorString, setUploadErrorString] = useState("");

  const [selectedAvatar, setSelectedAvatar] = useState<
    | {
        from: "default-avatars";
        index: number;
      }
    | {
        from: "uploaded-image";
      }
    | null
  >(null);
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
      const imageSources = await fetchImageSources();
      setDefaultAvatars(imageSources);
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage.objectURL);
    };
  }, [uploadedImage]);

  const avatarElements = defaultAvatars.map((imageSrc, index) => {
    const isSelected =
      selectedAvatar !== null &&
      selectedAvatar.from === "default-avatars" &&
      selectedAvatar.index === index;
    return (
      <AvatarButton
        key={index}
        src={imageSrc}
        isSelected={isSelected}
        onClick={() => {
          setSelectedAvatar({
            from: "default-avatars",
            index,
          });
        }}
      />
    );
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
              let url: string;

              if (selectedAvatar.from === "default-avatars") {
                url = defaultAvatars[selectedAvatar.index];
              } else {
                url = uploadedImage!.objectURL;
              }

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
        <Button onClick={handleSubmit}>Change</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  function handleSubmit() {}

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

    setSelectedAvatar({ from: "uploaded-image" });

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

async function fetchImageSources() {
  return [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7];
}

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
