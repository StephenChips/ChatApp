import { Box, Typography, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { useNavigate } from "react-router";

export function Account() {
  const navigate = useNavigate();

  return (
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
      <Box>Your Notifications</Box>
    </Box>
  );
}
