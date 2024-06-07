import { configureStore } from "@reduxjs/toolkit"
import contactsReducer from "./contacts"
import usersReducer from "./users"
import { useDispatch, useSelector, useStore } from "react-redux"

export const store = configureStore({
  reducer: {
    contacts: contactsReducer,
    users: usersReducer
  }
})

export type AppStore = typeof store
export type RootState = ReturnType<AppStore["getState"]> 
export type AppDispatch = AppStore["dispatch"]

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()
