import {
  Alert,
  AlertColor,
  Box,
  Button,
  Card,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { LOG_IN_AND_SIGN_UP_PAGE_BACKGROUND } from "../../constants";
import React, { useEffect, useRef, useState } from "react";
import { PasswordField } from "../../components/PasswordField";
import { useNavigate } from "react-router";

export function SignUp() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [passwordError, setPasswordError] = useState<string | null>("");
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
  const timeoutIDRef = useRef<number>();
  snackbarStateRef.current = snackbarState;

  useEffect(() => {
    if (snackbarState !== "visible") return;
    if (timeoutIDRef.current !== undefined) {
      clearTimeout(timeoutIDRef.current);
    }
    timeoutIDRef.current = setTimeout(() => {
      setSnackbarState("hidden");
    }, 2000);
  }, [snackbarState]);

  return (
    <Box
      sx={{
        background: LOG_IN_AND_SIGN_UP_PAGE_BACKGROUND,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card
        sx={{
          width: "513px",
        }}
      >
        <Box sx={{ margin: 3 }} component="form" onSubmit={onCreateAccount}>
          <Typography variant="h5" marginBottom={5}>
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
            sx={{
              marginBottom: 2,
            }}
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
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ marginBottom: "10px" }}
          >
            Create Account
          </Button>
          <Button fullWidth onClick={() => navigate("/log-in")}>
            Cancel
          </Button>
        </Box>
      </Card>
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

    try {
      const result = await createAccount(username, password);

    } catch (e) {
      const error = e as Error;
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

async function createAccount(username: string, password: string) {}
