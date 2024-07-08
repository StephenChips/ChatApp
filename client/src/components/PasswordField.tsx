import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  TextFieldProps,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { useState } from "react";

export type PasswordFieldProps = Omit<TextFieldProps, "type">;

/**
 * A thin wrapper of MUI 5's \<TextField />. By default the password
 * a user inputed is hidden, and it provides a button for temporarily
 * revealing the password.
 *
 * The props on this component are the same as the <TextField />,
 * execpts the "type" atrribute isomitted, for it is now managed by
 * the component itself.
 *
 * @param props
 * @returns
 */
export function PasswordField(props: PasswordFieldProps) {
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);

  return (
    <TextField
      {...props}
      type={isPasswordHidden ? "password" : "text"}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onMouseDown={() => setIsPasswordHidden(false)}
              onMouseUp={() => setIsPasswordHidden(true)}
              edge="end"
              size="small"
              disabled={typeof props.value !== "string" || props.value === ""}
            >
              {isPasswordHidden ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    ></TextField>
  );
}
