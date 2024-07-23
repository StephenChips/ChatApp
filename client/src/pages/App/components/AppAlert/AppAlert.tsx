import { Alert } from "@mui/material";
import { selectAppAlert, AppAlertActions } from "../../../../store/appAlert";
import { useAppDispatch, useAppSelector } from "../../../../store";
import React from "react";

export function AppAlert({ style = {} }: { style?: React.CSSProperties }) {
  const dispatch = useAppDispatch();
  const appAlert = useAppSelector(selectAppAlert);

  return (
    <div style={style}>
      <div style={{ display: appAlert.visible ? "block" : "none" }}>
        <Alert
          severity={appAlert.severity}
          onClose={() => dispatch(AppAlertActions.hide())}
          sx={{ whiteSpace: "pre" }}
        >
          {appAlert.alertText}
        </Alert>
      </div>
    </div>
  );
}
