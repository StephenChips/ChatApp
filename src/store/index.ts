import axios from "axios"
import { configureStore, ThunkAction, UnknownAction } from "@reduxjs/toolkit"
import contactsReducer, { setAllContacts } from "./contacts"
import appUsersReducer, { selectAppUser } from "./appUser"
import { useDispatch, useSelector, useStore } from "react-redux"

export const store = configureStore({
  reducer: {
    contacts: contactsReducer,
    appUser: appUsersReducer
  }
})

export type AppStore = typeof store
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()

export function initializeStore() : ThunkAction<void, RootState, unknown, UnknownAction> {
  return async function (dispatch, getState) {
    const appUser = selectAppUser(getState())
    const { data } = await axios.post("/api/getContactsWithMessages", { appUserID: appUser?.id })

    dispatch(setAllContacts(data))
  }
}
