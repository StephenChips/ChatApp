import { useAppDispatch, useAppSelector } from "./store";
import { AppUserActions, selectLogInToken } from "./store/appUser";

export function useLogIn() {
  const logInToken = useAppSelector(selectLogInToken);
  const dispatch = useAppDispatch();

  async function logIn() {}

  async function logout() {
    // Since we use RESTful auth (JWT), so to logout means deleting the
    // current token.
    dispatch(AppUserActions.clearAll());
  }

  return {
    logInToken,
    logIn,
    logout,
    loggedIn: logInToken !== undefined,
  };
}
