import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, initAppStore, resetState, RootState } from ".";
import axios, { AxiosError, AxiosResponse } from "axios";
import { User } from "./modeltypes";
import { closeSocket } from "../socket";

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

export type LogOutReason = {
  type: "password has changed",
  userID: User["id"]
}

export type AppUserStore = {
  logInToken: string | null;
  appUser: User | null;
  logOutReason: LogOutReason | null
};

const initialState: AppUserStore = {
  logInToken: null,
  appUser: null,
  logOutReason: null
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
    setAppUsername(state, { payload: newName }: PayloadAction<string>) {
      if (!state.appUser) return;
      state.appUser.name = newName;
    },
    setAppUserAvatarURL(state, { payload: avatarURL }: PayloadAction<string>) {
      if (!state.appUser) return;
      state.appUser.avatarURL = avatarURL;
    },
    setLogOutReason(state, { payload: reason }: PayloadAction<LogOutReason | null>) {
      state.logOutReason = reason;
    }
  },
  extraReducers(builder) {
    builder.addCase("resetState", () => initialState);
  },
});

export default appUser.reducer;

export const selectLogInToken = (state: RootState) => state.appUser.logInToken;
export const selectAppUser = (state: RootState) => state.appUser.appUser;
export const selectHasLoggedIn = (state: RootState) =>
  selectLogInToken(state) !== null &&
  selectAppUser(state) !== null;
export const selectLogOutReason = (state: RootState) => state.appUser.logOutReason;

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
      ThunkAPI,
    ) => {
      const dispatch = ThunkAPI.dispatch as AppDispatch;
      let response: AxiosResponse;

      try {
        response = await axios.post("/api/issueJWT", { userID, password });
      } catch (e) {
        const error = e as AxiosError;
        if (error.status === 500) console.error(error);
        const data = error.response!.data as { message: string };
        throw new Error(data.message);
      }

      const { jwt: logInToken } = response.data as { jwt: string };

      localStorage.removeItem(LOGIN_TOKEN_KEY);
      sessionStorage.removeItem(LOGIN_TOKEN_KEY);

      if (rememberMe) {
        localStorage.setItem(LOGIN_TOKEN_KEY, logInToken);
      } else {
        sessionStorage.setItem(LOGIN_TOKEN_KEY, logInToken);
      }

      dispatch(appUser.actions.setLogOutReason(null));
      await dispatch(initAppStore());
    },
  ),

  logOut: createAsyncThunk("/appUser/logOut", (reason: LogOutReason | null, { dispatch }) => {
    localStorage.removeItem(LOGIN_TOKEN_KEY);
    sessionStorage.removeItem(LOGIN_TOKEN_KEY);
    closeSocket();
    dispatch(resetState());
    dispatch(appUser.actions.setLogOutReason(reason));
  }),

  fetchAppUser: createAsyncThunk(
    "/appUser/fetchAppUser",
    async (_, ThunkAPI) => {
      const dispatch = ThunkAPI.dispatch as AppDispatch;
      const rootState = ThunkAPI.getState() as RootState;

      const jwt = selectLogInToken(rootState);
      const { sub: userID } = decodeJWT(jwt!);

      const { data: user } = await axios.post("/api/getUserPublicInfo", {
        id: userID,
      });
      dispatch(appUser.actions.setAppUser(user));
    },
  ),

  setUsername: createAsyncThunk(
    "/appUser/setUsername",
    async (name: string, ThunkAPI) => {
      const dispatch = ThunkAPI.dispatch as AppDispatch;
      const getState = ThunkAPI.getState as () => RootState;

      const logInToken = selectLogInToken(getState());

      const headers: Record<string, string> = {};
      if (logInToken !== null) {
        headers["Authorization"] = `Bearer ${logInToken}`;
      }

      try {
        await axios("/api/setUsername", {
          method: "POST",
          headers,
          data: { name },
        });
      } catch (e) {
        const error = e as AxiosError;
        throw error.response!.data;
      }

      dispatch(appUser.actions.setAppUsername(name));
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

      try {
        const { data }: { data: { url: string } } = await axios(
          "/api/setUserAvatar",
          {
            method: "POST",
            headers,
            data: formData,
          },
        );

        dispatch(appUser.actions.setAppUserAvatarURL(data.url));
      } catch (e) {
        console.error(e);
        const error = e as AxiosError;
        throw error.response!.data;
      }
    },
  ),
};
