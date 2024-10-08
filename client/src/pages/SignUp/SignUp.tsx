import {
  Alert,
  AlertColor,
  Box,
  Button,
  LinearProgress,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import axios from "axios";
import { RADIAL_GRADIENT_BACKGROUND } from "../../constants";
import React, { useEffect, useRef, useState } from "react";
import { PasswordField } from "../../components/PasswordField";
import { useNavigate } from "react-router";
import { useAppDispatch } from "../../store";
import { AppUserThunks } from "../../store/appUser";

export function SignUp() {
  const theme = useTheme();
  const isViewportWiderThanSmallBreakpoint = useMediaQuery(
    theme.breakpoints.up("sm"),
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordConfirmationError, setPasswordConfirmationError] = useState<
    string | null
  >(null);

  const [alertContent, setAlertContent] = useState<{
    severity: AlertColor;
    text: string;
  }>({
    severity: "error",
    text: "",
  });

  type SnackbarState = "hidden" | "will-be-visible" | "visible";
  const [snackbarState, setSnackbarState] = useState<SnackbarState>("hidden");
  const snackbarStateRef = useRef<SnackbarState>();
  const timeoutIDRef = useRef<ReturnType<typeof setTimeout>>();
  snackbarStateRef.current = snackbarState;

  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    if (snackbarState !== "visible") return;
    if (timeoutIDRef.current !== undefined) {
      clearTimeout(timeoutIDRef.current);
    }
    timeoutIDRef.current = setTimeout(() => {
      setSnackbarState("hidden");
    }, 2000);
  }, [snackbarState]);

  let signUpFormStyle;

  if (isViewportWiderThanSmallBreakpoint) {
    signUpFormStyle = {
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      width: "500px",
      height: "500px",
      background: theme.palette.background.paper,
      borderRadius: 4,
      padding: 3,
    };
  } else {
    signUpFormStyle = {
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      width: "100%",
      height: "100%",
      padding: 3,
    };
  }

  return (
    <Box
      sx={{
        background: isViewportWiderThanSmallBreakpoint
          ? RADIAL_GRADIENT_BACKGROUND
          : undefined,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Box component="form" sx={signUpFormStyle} onSubmit={onCreateAccount}>
        <Typography variant="h5" marginBottom="auto">
          Sign Up
        </Typography>
        <TextField
          required
          label="Username"
          variant="outlined"
          fullWidth
          sx={{
            marginBottom: 2,
          }}
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            e.target.setCustomValidity("");
          }}
          onInvalid={(e) => {
            const el = e.target as HTMLInputElement;
            el.setCustomValidity("Please enter your username.");
          }}
        />
        <PasswordField
          error={passwordError !== null}
          required
          label="Password"
          variant="outlined"
          sx={{ marginBottom: 2 }}
          fullWidth
          value={password}
          onChange={(e) => {
            setPasswordError(null);
            setPassword(e.target.value);
            e.target.setCustomValidity("");
          }}
          onInvalid={(e) => {
            const el = e.target as HTMLInputElement;
            el.setCustomValidity("Please enter your password.");
          }}
          helperText={passwordError}
        />
        <PasswordField
          error={passwordConfirmationError !== null}
          required
          label="Enter the password again"
          variant="outlined"
          sx={{
            marginBottom: 4,
          }}
          fullWidth
          value={passwordConfirmation}
          onChange={(e) => {
            setPasswordConfirmationError(null);
            setPasswordConfirmation(e.target.value);
            e.target.setCustomValidity("");
          }}
          onInvalid={(e) => {
            const el = e.target as HTMLInputElement;
            el.setCustomValidity("Please enter your password again.");
          }}
          helperText={passwordConfirmationError}
        />

        {isCreatingAccount ? (
          <>
            <LinearProgress sx={{ marginBottom: "10px" }} />
            <Typography variant="body2" textAlign="center" display="block">
              Your account is being created. Please don't leave this page.
            </Typography>
          </>
        ) : (
          <>
            <Button
              fullWidth
              type="submit"
              variant={isCreatingAccount ? "text" : "contained"}
              sx={{ marginBottom: "10px" }}
            >
              Create Account
            </Button>
            <Button
              fullWidth
              onClick={() => navigate("/log-in")}
              disabled={isCreatingAccount}
            >
              Cancel
            </Button>
          </>
        )}
      </Box>
      <Snackbar
        open={snackbarState === "visible"}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={2000}
        TransitionProps={{
          onExited() {
            if (snackbarStateRef.current === "will-be-visible") {
              setSnackbarState("visible");
            }
          },
        }}
      >
        <Alert severity={alertContent.severity}>{alertContent.text}</Alert>
      </Snackbar>
    </Box>
  );

  /* FUNCTIONS */

  async function onCreateAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!password.match(/^[\d\w]+$/)) {
      setPasswordError(
        "A password can only contain digits and English letters.",
      );
      return;
    }

    if (password.length < 8) {
      setPasswordError("Password length should at least be 8.");
      return;
    }

    if (password !== passwordConfirmation) {
      setPasswordConfirmationError(
        "This password isn't the same as the one you entered above.",
      );
      return;
    }

    setIsCreatingAccount(true);

    try {
      const response = await axios.post("/api/createUser", {
        name: username,
        password,
      });
      const userID = response.data.id;
      await dispatch(
        AppUserThunks.logIn({ userID, password, rememberMe: false }),
      );
      navigate("/welcome");
    } catch (e) {
      const error = e as Error;
      setIsCreatingAccount(false);
      showAlert(
        "error",
        error.message || "Something wrong happened, please retry.",
      );
    }
  }

  function showAlert(severity: AlertColor, text: string) {
    setAlertContent({ severity, text });

    if (snackbarStateRef.current === "visible") {
      setSnackbarState("will-be-visible");
    } else {
      setSnackbarState("visible");
    }
  }
}
