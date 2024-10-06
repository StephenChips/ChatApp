import { ArrowForward, Delete } from "@mui/icons-material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Avatar,
  Typography,
  DialogContentText,
  IconButton,
  Button,
  DialogActions,
  styled,
  LinearProgress,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { createAvatarFromBlob } from "../pages/utils";
import { useAppSelector } from "../store";
import { AvatarSource, selectAppUser } from "../store/appUser";
import axios from "axios";

export function ChangeAvatarDialog({
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
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    onDrop(files: File[]) {
      onSelectedFileFromFilePicker(files);
    },
  });
  const acceptedFileMIME = ["image/png", "image/jpeg"];
  const appUser = useAppSelector(selectAppUser);

  const [uploadErrorString, setUploadErrorString] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarSource | null>(
    null,
  );
  const [uploadedImage, setUploadedImage] = useState<{
    file: Blob;
    objectURL: string;
  } | null>(null);
  const [defaultAvatars, setDefaultAvatars] = useState<string[]>([]);
  const [isCompressingImage, setIsCompressingImage] = useState(false);

  useEffect(() => {
    if (open) return;
    // Run this effect when the dialog's closed (or before closing).

    setSelectedAvatar(null);
    deleteUploadedImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    (async () => {
      const response = await axios.post("/api/getDefaultAvatars");
      const imageSources = response.data.map((o: { url: string }) => o.url);
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
      onClose={() => {
        if (isCompressingImage) return;
        onClose();
      }}
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
          marginTop={1}
          justifyContent="space-around"
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
                    from: "blob",
                    blob: uploadedImage.file,
                  })
                }
                isSelected={
                  selectedAvatar !== null && selectedAvatar.from === "blob"
                }
              />
            </Box>
            <IconButton onClick={deleteUploadedImage}>
              <Delete />
            </IconButton>
          </Box>
        ) : (
          <Box
            {...(fullScreen ? {} : getRootProps())}
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
            {fullScreen ? null : (
              <input
                {...getInputProps({
                  onChange() {
                    console.log("outer input changed file");
                  },
                })}
              />
            )}
            <Box>
              {(() => {
                if (isDragActive) {
                  return <>Drop the images here ...</>;
                }

                if (fullScreen) {
                  return (
                    <>
                      <Button
                        variant="outlined"
                        component="label"
                        sx={{ marginLeft: 1 }}
                      >
                        UPLOAD AVATAR
                        <VisuallyHiddenInput
                          type="file"
                          accept={acceptedFileMIME.join(",")}
                          onChange={(e) => {
                            console.log("changed file");
                            onSelectedFileFromFilePicker(
                              e.target?.files ?? undefined,
                            );
                          }}
                        />
                      </Button>
                    </>
                  );
                }

                return (
                  <>
                    Drag 'n' drop your image file here or{" "}
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{ marginLeft: 1 }}
                    >
                      UPLOAD
                      <VisuallyHiddenInput
                        type="file"
                        accept={acceptedFileMIME.join(",")}
                        onChange={(e) => {
                          onSelectedFileFromFilePicker(
                            e.target?.files ?? undefined,
                          );
                        }}
                      />
                    </Button>
                  </>
                );
              })()}

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
      <DialogContent sx={{
        display: isCompressingImage ? null : "none",
        flexGrow: 0,
      }}>
        <Box textAlign="center" marginBottom={1}>
          Compressing image ...
        </Box>
        <LinearProgress />
      </DialogContent>
      <DialogActions
        sx={{
          display: isCompressingImage ? "none" : null,
        }}
      >
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
    if (selectedAvatar.from === "blob") {
      setIsCompressingImage(true);
      // TODO Jimp works on the main thread and blocks UI, which cause the <LinearProgress /> to froze.
      const blob = await createAvatarFromBlob(selectedAvatar.blob, 200);
      setIsCompressingImage(false);
      $onSubmit({
        ...selectedAvatar,
        blob,
      });
    } else {
      $onSubmit(selectedAvatar);
    }
  }

  async function onSelectedFileFromFilePicker(files?: FileList | File[]) {
    const file = files?.[0];
    if (!file) {
      setUploadErrorString("You didn't select a file to upload");
      return;
    }

    if (!acceptedFileMIME.includes(file.type)) {
      setUploadErrorString("Please select a JPEG or a PNG image to upload.");
      return;
    }

    setSelectedAvatar({ from: "blob", blob: file });
    setUploadedImage({
      file: file,
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
