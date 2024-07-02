import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";
import { User } from "./modeltypes";

export type AppUserStore = {
  appUser?: User;
  loginToken?: string;
};

// const initialState: AppUserStore = {
//   appUser: {
//     id: 0,
//     name: "John Wick",
//     avatarURL:
//       "https://fastly.picsum.photos/id/469/50/50.jpg?hmac=Wf4YHv-NPz_PHpK4sTzxM9tro8-_pomifQGnTv15x1E",
//   },
//   loginToken: "12344566785433456",
// };

export const LOCAL_STORAGE_AUTH_TOKEN_KEY = "chatapp-auth-token";

const initialState: AppUserStore = {
  loginToken: localStorage.getItem(LOCAL_STORAGE_AUTH_TOKEN_KEY) ?? undefined
}

const usersSlice = createSlice({
  name: "appUser",
  initialState,
  reducers: {
    setAppUser(state, { payload: appUser }: PayloadAction<User>) {
      state.appUser = appUser;
    },

    setLoginToken(state, { payload: loginToken }: PayloadAction<string>) {
      state.loginToken = loginToken;
    },

    clearAll() {
      return {};
    },
  },
});

export const selectAppUser = (state: RootState) => state.appUser.appUser;

export const selectLoginToken = (state: RootState) => state.appUser.loginToken;

export const { setAppUser } = usersSlice.actions;

export const AppUserActions = usersSlice.actions;

export default usersSlice.reducer;
