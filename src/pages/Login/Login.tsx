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
import { useLogIn } from "../hooks";
import { NavigateEffect } from "../../components/NavigateEffect";
import { useState } from "react";
import { useAppDispatch } from "../../store";
import { AppUserActions } from "../../store/appUser";
import { LOCAL_STORAGE_AUTH_TOKEN_KEY } from "../../store/appUser";
import { useNavigate } from "react-router";

const CHATAPP_ID_INPUT_ELEMENT_ID = "chatapp-id";
const PASSWORD_INPUT_ELEMENT_ID = "password";

export function LogIn() {
  const { logInToken } = useLogIn();
  const [rememberMe, setRememberMe] = useState(false);
  const [chatAppID, setChatAppID] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate()

  const [alertContent, setAlertContent] = useState<{
    severity: AlertColor;
    text: string;
  } | null>(null);

  if (logInToken !== undefined) {
    return <NavigateEffect to="/" />;
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        background: `
            radial-gradient(circle at 0% 200%, #2D7FFF 0%, rgba(255,255,255,0) 80%),
            radial-gradient(circle at 100% 100%, rgb(185, 234, 237) 0%, rgba(0,0,0,0) 70%)
        `,
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
          onSubmit={onLoggingIn}
        >
          <Typography variant="h5" marginBottom="auto">
            Please Log In
          </Typography>
          <TextField
            required
            id={CHATAPP_ID_INPUT_ELEMENT_ID}
            label="ChatApp ID"
            variant="outlined"
            fullWidth
            sx={{
              marginBottom: "15px",
            }}
            value={chatAppID}
            onChange={(e) => {
              setChatAppID(e.target.value);
              e.target.setCustomValidity("");
            }}
            onInvalid={(e) => {
              const el = e.target as HTMLInputElement;
              el.setCustomValidity("Please enter your ChatApp ID.");
            }}
          />
          <TextField
            required
            id={PASSWORD_INPUT_ELEMENT_ID}
            label="Password"
            variant="outlined"
            sx={{
              marginBottom: "5px",
            }}
            fullWidth
            InputProps={{
              type: "password",
            }}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              e.target.setCustomValidity("")
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
          <Button fullWidth onClick={() => navigate("/sign-up")}>Sign Up</Button>
        </Box>
      </Card>
    </Box>
  );

  /* FUNCTIONS */

  async function onLoggingIn() {
    try {
      const token = await HttpRequests.getAuthToken(chatAppID, password);
      dispatch(AppUserActions.setLogInToken(token));
      if (rememberMe) {
        localStorage.setItem(LOCAL_STORAGE_AUTH_TOKEN_KEY, token);
      }
    } catch (e) {
      const error = e as Error;
      switch (error.message) {
        case "no such user":
          showAlert("error", "No such user, please check your ChatApp ID.");
          break;
        case "incorrect password":
          showAlert("error", "The password isn't correct.");
          break;
        default:
          showAlert("error", "Unknown error");
          console.error(error);
          break;
      }
    }
  }

  function showAlert(severity: AlertColor, text: string) {
    setAlertContent({ severity, text });
  }
}

const HttpRequests = {
  async getAuthToken(chatAppID: string, password: string) {
    return "dasf123123rwsd";
  },
};
