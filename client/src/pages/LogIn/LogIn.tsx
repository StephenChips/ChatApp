import {
  Alert,
  AlertColor,
  Box,
  Button,
  Card,
  Checkbox,
  TextField,
  Typography,
} from "@mui/material";
import { NavigateEffect } from "../../components/NavigateEffect";
import { useState } from "react";
import { useNavigate } from "react-router";
import { RADIAL_GRADIENT_BACKGROUND } from "../../constants";
import { PasswordField } from "../../components/PasswordField";
import { useAppDispatch, useAppSelector } from "../../store";
import { AppUserThunks, selectHasLoggedIn } from "../../store/appUser";

const CHATAPP_ID_INPUT_ELEMENT_ID = "chatapp-id";
const PASSWORD_INPUT_ELEMENT_ID = "password";

export function LogIn() {
  const dispatch = useAppDispatch();
  const hasLoggedIn = useAppSelector(selectHasLoggedIn);
  const [rememberMe, setRememberMe] = useState(false);
  const [userID, setUserID] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const [alertContent, setAlertContent] = useState<{
    severity: AlertColor;
    text: string;
  } | null>(null);

  if (hasLoggedIn) {
    return <NavigateEffect to="/" />;
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        background: RADIAL_GRADIENT_BACKGROUND,
        position: "relative",
      }}
    >
      <Card
        elevation={3}
        sx={{
          width: "50%",
          height: "430px",
          maxWidth: "600px",
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          margin: "auto",
          display: "flex",
          flexDirection: "column",
        }}
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
      </Card>
    </Box>
  );

  /* FUNCTIONS */

  async function onLogIn(e: React.FormEvent) {
    e.preventDefault();

    try {
      await dispatch(AppUserThunks.logIn({
        userID,
        password,
        rememberMe
      })).unwrap();
    } catch (e) {
      const error = e as Error;
      showAlert("error", error.message);
    }
  }

  function showAlert(severity: AlertColor, text: string) {
    setAlertContent({ severity, text });
  }
}
