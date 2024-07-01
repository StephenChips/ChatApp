import { useAppDispatch, useAppSelector } from "../store";
import { AppUserActions, selectLoginToken } from "../store/appUser";

export function useLogin() {
  const loginToken = useAppSelector(selectLoginToken);
  const dispatch = useAppDispatch();

  async function login() {}

  async function logout() {
    // Since we use RESTful auth (JWT), so to logout means deleting the
    // current token.
    dispatch(AppUserActions.clearAll());
  }

  return {
    loginToken,
    login,
    logout,
    loggedIn: loginToken !== undefined,
  };
}
