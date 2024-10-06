import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { NavigateEffect } from "../../components/NavigateEffect";
import {
  AppUserThunks,
  AvatarSource,
  selectAppUser,
} from "../../store/appUser";
import { useAppDispatch, useAppSelector } from "../../store";
import { useNavigate } from "react-router";
import { useTheme } from "@mui/material";
import { ChangeAvatarDialog } from "../../components/ChangeAvatarDialog";
import { useState } from "react";
import { AppAlertActions } from "../../store/appAlert";
import { RADIAL_GRADIENT_BACKGROUND } from "../../constants";

export function Welcome() {
  const dispatch = useAppDispatch();
  const [isChangeAvatarDialogOpen, setIsChangeAvatarDialogOpen] =
    useState(false);
  const appUser = useAppSelector(selectAppUser);

  const theme = useTheme();
  const isViewportWiderThanSmallBreakpoint = useMediaQuery(
    theme.breakpoints.up("sm"),
  );
  const navigate = useNavigate();

  const cardStyle = isViewportWiderThanSmallBreakpoint
    ? { width: "600px" }
    : {
        width: "100%",
        height: "100%",
        borderRadius: 0,
      };

  if (!appUser) {
    return <NavigateEffect to="/" />;
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
      <Card sx={cardStyle}>
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
                {appUser.id}
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
                {appUser.name}
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
                <Avatar src={appUser.avatarURL} alt="user avatar" />
                <IconButton onClick={() => setIsChangeAvatarDialogOpen(true)}>
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
      <ChangeAvatarDialog
        open={isChangeAvatarDialogOpen}
        fullScreen={!isViewportWiderThanSmallBreakpoint}
        onClose={() => setIsChangeAvatarDialogOpen(false)}
        onSubmit={onSubmitAvatarChanged}
      />
    </Box>
  );

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
      setIsChangeAvatarDialogOpen(false);
    }
  }
}
