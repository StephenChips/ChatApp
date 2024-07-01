import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  TextField,
  Typography,
} from "@mui/material";
import { useLogin } from "../hooks";
import { NavigateEffect } from "../../components/NavigateEffect";

export function Login() {
  const { loggedIn } = useLogin();

  if (loggedIn) {
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
        <Alert severity="info">Your password is changed.</Alert>
        <Box
          sx={{
            margin: 3,
            display: "flex",
            flexDirection: "column",
            flex: 1
          }}
        >
          <Typography variant="h5" marginBottom="auto">
            Please Log In
          </Typography>
          <TextField
            id="chatapp-id"
            label="ChatApp ID"
            variant="outlined"
            fullWidth
            sx={{
              marginBottom: "15px",
            }}
          />
          <TextField
            id="password"
            label="Password"
            variant="outlined"
            sx={{
              marginBottom: "5px",
            }}
            fullWidth
            InputProps={{
              type: "password",
            }}
          />
          <Box display="flex" alignItems="center" marginBottom="10px">
            <Checkbox
              sx={{ transform: "translateY(1px)", marginRight: "5px" }}
            />
            <span>Remember Me</span>
          </Box>
          <Button fullWidth variant="contained" sx={{ marginBottom: "10px" }}>
            Log In
          </Button>
          <Button fullWidth>Sign Up</Button>
        </Box>
      </Card>
    </Box>
  );
}
