import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  styled,
  Typography,
} from "@mui/material";
import { RADIAL_GRADIENT_BACKGROUND } from "../../constants";
import { ArrowForward, Delete, Edit } from "@mui/icons-material";
import { NavigateEffect } from "../../components/NavigateEffect";
import { selectAppUser, setAppUser } from "../../store/appUser";
import { useAppDispatch, useAppSelector } from "../../store";
import { useEffect, useState } from "react";
import { User } from "../../store/modeltypes";

// Dummy images. Eventually they should be fetched from the beckend.
import avatar1 from "../../assets/avatar1.svg";
import avatar2 from "../../assets/avatar2.svg";
import avatar3 from "../../assets/avatar3.svg";
import avatar4 from "../../assets/avatar4.svg";
import avatar5 from "../../assets/avatar5.svg";
import avatar6 from "../../assets/avatar6.svg";
import avatar7 from "../../assets/avatar7.svg";
import { useNavigate } from "react-router";

type AvatarSource =
  | { from: "url"; url: string }
  | { from: "uploaded-image"; imageFile: File };

export function Welcome() {
  const dispatch = useAppDispatch();
  const appUser = useAppSelector(selectAppUser);
  const [cardBeingDisplayed, displayCard] = useState<
    "welcome-card" | "change-avatar"
  >("welcome-card");

  let component: JSX.Element;

  const [defaultAvatars, setDefaultAvatars] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const imageSources = await fetchDefaultAvatars();
      setDefaultAvatars(imageSources);
    })();
  }, []);

  if (!appUser) {
    return <NavigateEffect to="/" />;
  }

  if (cardBeingDisplayed === "welcome-card") {
    component = (
      <WelcomeCard
        user={appUser}
        onChangeAvatar={() => displayCard("change-avatar")}
      />
    );
  } else {
    component = (
      <ChangeAvatarCard
        onChangeAvatar={onChangeAvatar}
        onClose={() => displayCard("welcome-card")}
        defaultAvatarURLs={defaultAvatars}
      />
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        background: RADIAL_GRADIENT_BACKGROUND,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {component}
    </Box>
  );

  async function onChangeAvatar(newAvatarSource: AvatarSource) {
    const { url } = await updateUserAvatar(newAvatarSource);

    dispatch(
      setAppUser({
        ...appUser!,
        avatarURL: url,
      }),
    );

    displayCard("welcome-card");
  }
}

function WelcomeCard({
  user,
  onChangeAvatar,
}: {
  user: User;
  onChangeAvatar: () => void;
}) {
  const navigate = useNavigate();

  return (
    <Card sx={{ width: "400px" }}>
      <CardHeader title="Welcome"></CardHeader>
      <CardContent>
        <Typography marginBottom={2}>
          Your account is created successfully.
        </Typography>
        <Box
          padding={2}
          border="1px solid lightgray"
          borderRadius="5px"
          marginX="auto"
        >
          <Box
            marginBottom={1}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body1">ChatApp ID</Typography>
            <Typography variant="h6" color="primary.main">
              {user.id}
            </Typography>
          </Box>
          <Box
            marginBottom={1}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body1">Username</Typography>
            <Typography variant="h6" color="primary.main">
              {user.name}
            </Typography>
          </Box>
          <Box
            marginBottom={1}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="body1">Avatar</Typography>
            <Box display="flex">
              <Avatar src={user.avatarURL} alt="user avatar" />
              <IconButton onClick={onChangeAvatar}>
                <Edit />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </CardContent>
      <CardActions>
        <Button fullWidth onClick={() => navigate("/")}>
          Start Messaging
        </Button>
      </CardActions>
    </Card>
  );
}

function ChangeAvatarCard({
  defaultAvatarURLs,
  onChangeAvatar,
  onClose,
}: {
  onChangeAvatar: (newAvatarSource: AvatarSource) => void;
  onClose: () => void;
  defaultAvatarURLs: string[];
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

  const avatarElements = defaultAvatarURLs.map((avatarURL, index) => {
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
    <Card sx={{ width: "600px" }}>
      <CardHeader title="Change Avatar" />
      <CardContent>
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
        <Typography marginTop={2}>Default Avatars</Typography>
        <Box
          display="flex"
          gap="15px"
          marginTop={1}
          marginX="auto"
          flexWrap="wrap"
        >
          {avatarElements}
        </Box>
        <Typography marginTop={3}>
          {uploadedImage ? "Uploaded Image" : "Upload"}
        </Typography>
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
      </CardContent>
      <CardActions>
        <Button
          onClick={onClickChangeAvatarButton}
          disabled={selectedAvatar === null}
        >
          Change
        </Button>
        <Button onClick={onClose}>Close</Button>
      </CardActions>
    </Card>
  );

  async function onClickChangeAvatarButton() {
    if (!selectedAvatar) return;
    onChangeAvatar(selectedAvatar);
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

async function fetchDefaultAvatars() {
  return [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function updateUserAvatar(_avatarSource: AvatarSource) {
  // TODO to be implemented
  return { url: "" };
}
