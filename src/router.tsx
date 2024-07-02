import { createBrowserRouter } from "react-router-dom";
import { App } from "../src/pages/App/App";
import { MessageWindow } from "./pages/App/components/MessageWindow/MessageWindow";
import { NotificationWindow } from "./pages/NotificationWindow/NotificationWindow.tsx";
import { Account } from "./pages/AccountSettings/AccountSettings.tsx";
import { LogIn } from "./pages/LogIn/LogIn.tsx";
import { SignUp } from "./pages/SignUp/SignUp.tsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/contact/:userID/chat",
        element: <MessageWindow />,
      },
      {
        path: "/notifications",
        element: <NotificationWindow />,
      },
      {
        path: "/account",
        element: <Account />,
      },
    ],
  },
  {
    path: "/log-in",
    element: <LogIn />,
  },
  {
    path: "/sign-up",
    element: <SignUp />,
  },
]);
