import axios from "axios";
import { useAppDispatch } from "./store";
import { AppUserActions } from "./store/appUser";
import { User } from "./store/modeltypes";

export function useLogIn() {
  const LOGIN_TOKEN_KEY = "login-token";
  const dispatch = useAppDispatch();

  async function logIn(userID: number, password: string, rememberMe = false) {
    const { jwt } = await getJWT(userID, password);
    const user = await getUserPublicInfo(userID);
    dispatch(AppUserActions.setAppUser(user));
    dispatch(AppUserActions.setLogInToken(jwt));

    localStorage.removeItem(LOGIN_TOKEN_KEY);
    sessionStorage.removeItem(LOGIN_TOKEN_KEY);

    if (rememberMe) {
      localStorage.setItem(LOGIN_TOKEN_KEY, jwt);
    } else {
      sessionStorage.setItem(LOGIN_TOKEN_KEY, jwt);
    }
  }

  function logout() {
    localStorage.removeItem(LOGIN_TOKEN_KEY);
    sessionStorage.removeItem(LOGIN_TOKEN_KEY);
  }

  return {
    logIn,
    logout,
    get logInToken() {
      return localStorage.getItem(LOGIN_TOKEN_KEY)
        ?? sessionStorage.getItem(LOGIN_TOKEN_KEY);
    },
    get hasLoggedIn () {
      return this.logInToken !== null;
    }
  };
}

async function getJWT(userID: number, password: string) {
  const response = await axios.post("/api/issueJWT", { userID, password });

  return await response.data as {
    jwt: string
  };
}

async function getUserPublicInfo(userID: number) {
  const response = await axios.post("/api/getUserPublicInfo", { id: userID });
  return await response.data as User;
}