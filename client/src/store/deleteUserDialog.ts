import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "./modeltypes";

type DeleteUserConfirmDialogState =
  | {
      status: "hidden";
    }
  | {
      status: "confirming";
      user: User;
    }
  | {
      status: "succeeded";
      user: User;
    };

const initialState: DeleteUserConfirmDialogState = {
  status: "hidden",
};

const slice = createSlice({
  name: "popovers",
  initialState: initialState as DeleteUserConfirmDialogState,
  reducers: {
    confirming(_state, { payload: user }: PayloadAction<User>) {
      return {
        status: "confirming",
        user,
      };
    },
    succeeded(_state, { payload: user }: PayloadAction<User>) {
      return {
        status: "succeeded",
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
