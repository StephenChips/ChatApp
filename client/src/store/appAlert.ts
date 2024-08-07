import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".";

type SeverityType = "success" | "info" | "warning" | "error";

type AppAlertType = {
  alertText: string;
  visible: boolean;
  severity: SeverityType;
};

const initialState: AppAlertType = {
  severity: "success",
  alertText: "",
  visible: false,
};

const store = createSlice({
  name: "appAlert",
  initialState,
  reducers: {
    show(
      _state,
      {
        payload: { alertText, severity = "success" },
      }: PayloadAction<{ alertText: string; severity: SeverityType }>,
    ) {
      return {
        visible: true,
        alertText,
        severity,
      };
    },

    hide(state) {
      state.alertText = "";
      state.visible = false;
    },

    reset() {
      return initialState;
    },
  },

  extraReducers(builder) {
    builder
      .addCase("/appUser/logOut/fulfilled", (state) => {
        store.caseReducers.hide(state);
      })
      .addCase("resetState", () => initialState);
  },
});

export const AppAlertActions = store.actions;

export default store.reducer;

export function selectAppAlert(rootState: RootState) {
  return rootState.appAlert;
}
