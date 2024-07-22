import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from ".";
import axios, { AxiosError, AxiosResponse } from "axios";
import { User } from "./modeltypes";

const LOGIN_TOKEN_KEY = "login-token";

function decodeJWT(token: string) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );

  return JSON.parse(jsonPayload);
}

export type AvatarSource =
  | { from: "url"; url: string }
  | { from: "uploaded-image"; imageFile: File };

export type AppUserStore = {
  logInToken: string | null;
  appUser: User | null;
};

const initialState: AppUserStore = {
  logInToken: null,
  appUser: null,
};

const appUser = createSlice({
  name: "appUser",
  initialState: initialState as AppUserStore,
  reducers: {
    setLogInToken(
      state,
      { payload: logInToken }: PayloadAction<string | null>,
    ) {
      state.logInToken = logInToken;
    },
    setAppUser(state, { payload: user }: PayloadAction<User | null>) {
      state.appUser = user;
    },
    setAppUserName(state, { payload: newName }: PayloadAction<string>) {
      if (!state.appUser) return;
      state.appUser.name = newName;
    },
    setAppUserAvatarURL(state, { payload: avatarURL }: PayloadAction<string>) {
      if (!state.appUser) return;
      state.appUser.avatarURL = avatarURL;
    },
  },
});

export default appUser.reducer;

export const selectLogInToken = (state: RootState) => state.appUser.logInToken;
export const selectAppUser = (state: RootState) => state.appUser.appUser;
export const selectHasLoggedIn = (state: RootState) =>
  !!selectLogInToken(state);

export const AppUserThunks = {
  initStore: createAsyncThunk("/appUser/initStore", async (_, { dispatch }) => {
    let logInToken = localStorage.getItem(LOGIN_TOKEN_KEY);
    if (logInToken === null) {
      logInToken = sessionStorage.getItem(LOGIN_TOKEN_KEY);
    }

    dispatch(appUser.actions.setLogInToken(logInToken));

    if (logInToken !== null) {
      const { sub: id } = decodeJWT(logInToken);
      const { data: user } = await axios.post("/api/getUserPublicInfo", { id });
      dispatch(appUser.actions.setAppUser(user));
    }
  }),

  logIn: createAsyncThunk(
    "/appUser/logIn",
    async (
      {
        userID,
        password,
        rememberMe,
      }: { userID: string; password: string; rememberMe?: boolean },
      { dispatch },
    ) => {
      let response: AxiosResponse;

      try {
        response = await axios.post("/api/issueJWT", { userID, password });
      } catch (e) {
        const error = e as AxiosError;
        if (error.status === 500) console.error(error);
        const data = error.response!.data as { message: string };
        throw new Error(data.message);
      }

      console.log(response);
      const { jwt: logInToken } = response.data as { jwt: string };

      localStorage.removeItem(LOGIN_TOKEN_KEY);
      sessionStorage.removeItem(LOGIN_TOKEN_KEY);

      if (rememberMe) {
        localStorage.setItem(LOGIN_TOKEN_KEY, logInToken);
      } else {
        sessionStorage.setItem(LOGIN_TOKEN_KEY, logInToken);
      }

      dispatch(appUser.actions.setLogInToken(logInToken));

      const { data: user } = await axios.post("/api/getUserPublicInfo", {
        id: userID,
      });
      dispatch(appUser.actions.setAppUser(user));
    },
  ),

  logOut: createAsyncThunk("/appUser/logOut", (_, { dispatch }) => {
    localStorage.removeItem(LOGIN_TOKEN_KEY);
    sessionStorage.removeItem(LOGIN_TOKEN_KEY);
    dispatch(appUser.actions.setLogInToken(null));
    dispatch(appUser.actions.setAppUser(null));
  }),

  setUserName: createAsyncThunk(
    "/appUser/setUserName",
    async (name: string, ThunkAPI) => {
      const dispatch = ThunkAPI.dispatch as AppDispatch;
      const getState = ThunkAPI.getState as () => RootState;

      const logInToken = selectLogInToken(getState());

      const headers: Record<string, string> = {};
      if (logInToken !== null) {
        headers["Authorization"] = `Bearer ${logInToken}`;
      }

      await axios("/api/setUserName", {
        method: "POST",
        headers,
        data: { name },
      });

      dispatch(appUser.actions.setAppUserName(name));
    },
  ),

  setUserAvatar: createAsyncThunk(
    "/appUser/setUserAvatar",
    async (avatarSource: AvatarSource, ThunkAPI) => {
      const dispatch = ThunkAPI.dispatch as AppDispatch;
      const getState = ThunkAPI.getState as () => RootState;

      const logInToken = selectLogInToken(getState());

      const headers: Record<string, string> = {};
      if (logInToken !== null) {
        headers["Authorization"] = `Bearer ${logInToken}`;
      }

      const formData = new FormData();

      if (avatarSource.from === "url") {
        formData.append("url", avatarSource.url);
      } else {
        formData.append("imageFile", avatarSource.imageFile);
      }

      const { data }: { data: { url: string } } = await axios(
        "/api/setUserAvatar",
        {
          method: "POST",
          headers,
          data: formData,
        },
      );

      dispatch(appUser.actions.setAppUserAvatarURL(data.url));
    },
  ),
};
