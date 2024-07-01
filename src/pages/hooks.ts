import { useAppSelector } from "../store";
import { selectLoginToken } from "../store/appUser";

export function useLogin() {
  const loginToken = useAppSelector(selectLoginToken);

  function login() { }

  function logout() { }
  
  return {
    loginToken,
    login,
    logout,
    loggedIn: loginToken !== undefined,
  };
}
