import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { initAppStore, store } from "./store";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import { router } from "./router";
import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material/styles";

async function main() {
  await store.dispatch(initAppStore());

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ThemeProvider theme={createTheme()}>
        <Provider store={store}>
          <RouterProvider router={router}></RouterProvider>
        </Provider>
      </ThemeProvider>
    </React.StrictMode>,
  );
}

main();
