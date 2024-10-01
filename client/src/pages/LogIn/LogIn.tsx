import {
  Alert,
  AlertColor,
  Box,
  Button,
  Checkbox,
  TextField,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { NavigateEffect } from "../../components/NavigateEffect";
import { useState } from "react";
import { useNavigate } from "react-router";
import { RADIAL_GRADIENT_BACKGROUND } from "../../constants";
import { PasswordField } from "../../components/PasswordField";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  AppUserThunks,
  selectHasLoggedIn,
  selectLogOutReason,
} from "../../store/appUser";

const CHATAPP_ID_INPUT_ELEMENT_ID = "chatapp-id";
const PASSWORD_INPUT_ELEMENT_ID = "password";

export function LogIn() {
  const theme = useTheme();
  const isViewportWiderThanSmallBreakpoint = useMediaQuery((theme: Theme) =>
    theme.breakpoints.up("sm"),
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const hasLoggedIn = useAppSelector(selectHasLoggedIn);
  const logOutReason = useAppSelector(selectLogOutReason);
  const [rememberMe, setRememberMe] = useState(false);
  const [userID, setUserID] = useState(() =>
    logOutReason?.type === "password has changed"
      ? String(logOutReason.userID)
      : "",
  );
  const [password, setPassword] = useState("");

  const [alertContent, setAlertContent] = useState<{
    severity: AlertColor;
    text: string;
  } | null>(() =>
    logOutReason?.type === "password has changed"
      ? {
          severity: "info",
          text: "The password has changed, please log in again.",
        }
      : null,
  );

  if (hasLoggedIn) {
    return <NavigateEffect to="/" />;
  }

  let loginFormStyle;

  if (isViewportWiderThanSmallBreakpoint) {
    loginFormStyle = {
      width: "500px",
      height: "500px",
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      margin: "auto",
      display: "flex",
      flexDirection: "column",
      background: theme.palette.background.paper,
      borderRadius: 4,
    }
  } else {
    loginFormStyle = {
      display: "flex",
      flexDirection: "column",
      height: "100%"
    }
  }
  
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        background: isViewportWiderThanSmallBreakpoint ? RADIAL_GRADIENT_BACKGROUND : undefined,
        position: "relative",
      }}
    >
      <Box
        sx={loginFormStyle}
      >
        <Alert
          severity={alertContent?.severity}
          sx={alertContent === null ? { display: "none" } : {}}
        >
          {alertContent?.text}
        </Alert>
        <Box
          component="form"
          sx={{
            margin: 3,
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
          onSubmit={onLogIn}
        >
          <Typography variant="h5" marginBottom="auto">
            Please Log In
          </Typography>
          <TextField
            required
            autoComplete="off"
            id={CHATAPP_ID_INPUT_ELEMENT_ID}
            label="ChatApp ID"
            variant="outlined"
            fullWidth
            sx={{
              marginBottom: "15px",
            }}
            value={userID === null ? "" : userID.toString()}
            onChange={(e) => {
              const val = e.target.value;
              setUserID(val);
              e.target.setCustomValidity("");
            }}
            onInvalid={(e) => {
              const el = e.target as HTMLInputElement;
              el.setCustomValidity("Please enter your ChatApp ID.");
            }}
          />
          <PasswordField
            required
            id={PASSWORD_INPUT_ELEMENT_ID}
            label="Password"
            variant="outlined"
            sx={{
              marginBottom: "5px",
            }}
            autoComplete="off"
            fullWidth
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              e.target.setCustomValidity("");
            }}
            onInvalid={(e) => {
              const el = e.target as HTMLInputElement;
              el.setCustomValidity("Please enter your password.");
            }}
          />
          <Box display="flex" alignItems="center" marginBottom="10px">
            <Checkbox
              sx={{ transform: "translateY(1px)", marginRight: "5px" }}
              value={rememberMe}
              onChange={(e) => {
                setRememberMe(e.target.checked);
              }}
            />
            <span>Remember Me</span>
          </Box>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ marginBottom: "10px" }}
          >
            Log In
          </Button>
          <Button fullWidth onClick={() => navigate("/sign-up")}>
            Sign Up
          </Button>
        </Box>
      </Box>
    </Box>
  );

  /* FUNCTIONS */

  async function onLogIn(e: React.FormEvent) {
    e.preventDefault();

    try {
      await dispatch(
        AppUserThunks.logIn({
          userID,
          password,
          rememberMe,
        }),
      ).unwrap();
    } catch (e) {
      const error = e as Error;
      setAlertContent({ severity: "error", text: error.message });
    }
  }
}
