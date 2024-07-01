import { Box } from "@mui/material";
import { useLogin } from "../hooks";
import { NavigateEffect } from "../../components/NavigateEffect";

export function Login() {
    const { loggedIn } = useLogin()

    if (loggedIn) {
        return <NavigateEffect to="/" />
    }
    
    return (
        <Box>
            Login
        </Box>
    )
}