import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "./modeltypes";

type DeleteUserConfirmDialogState =
  | {
      status: "hidden";
    }
  | {
      status: "visible";
      user: User;
    };

const initialState: DeleteUserConfirmDialogState = {
  status: "hidden",
};

const slice = createSlice({
  name: "popovers",
  initialState: initialState as DeleteUserConfirmDialogState,
  reducers: {
    show(_state, { payload: user }: PayloadAction<User>) {
      return {
        status: "visible",
        user,
      };
    },
    hide() {
      return {
        status: "hidden",
      };
    },
  },

  extraReducers(builder) {
    builder.addCase("resetState", () => initialState);
  },
});

export const DeleteUserDialogActions = slice.actions;

export default slice.reducer;
