import { createBrowserRouter } from "react-router-dom"
import { App } from "../src/pages/App/App"
import { MessageWindow } from "./pages/App/components/MessageWindow/MessageWindow"
import { NotificationWindow } from "./pages/NotificationWindow/NotificationWindow.tsx"

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                path: "/contact/:userID/chat",
                element: <MessageWindow />
            },
            {
                path: "/notifications",
                element: <NotificationWindow />
            }
        ]
    }
])