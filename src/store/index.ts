
import { configureStore, ThunkAction, UnknownAction } from "@reduxjs/toolkit"
import contactsReducer, { setAllContacts } from "./contacts"
import appUsersReducer, { selectAppUser } from "./appUser"
import { useDispatch, useSelector, useStore } from "react-redux"

export const store = configureStore({
  reducer: {
    contacts: contactsReducer,
    appUser: appUsersReducer,
  }
})

export type AppStore = typeof store
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
export const useAppStore = useStore.withTypes<AppStore>()

let storeHasInitialized = false

export function getContactsWithMessages() {
  return [
    {
      user: {
        id: 1,
        name: "John",
        avatarURL: "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E"
      },
      messages: []
    },
    {
      user: {  
        id: 2,
        name: "Jack",
        avatarURL: "https://fastly.picsum.photos/id/174/50/50.jpg?hmac=mW6r1Zub6FvIFJsQBfPRVHD6r1n980M8y7kpNQ3scFI"
      },
      messages: []
    },
    {
      user: {  
        id: 3,
        name: "Paul",
        avatarURL: "https://fastly.picsum.photos/id/649/50/50.jpg?hmac=1DvRtR-LwNXehtjiit4CTZU6D6nXcN_aI6TqMwkw8PU"
      },
      messages: []
    },
  ]
}

export function initializeStore(): ThunkAction<void, RootState, unknown, UnknownAction> {
  return async function (dispatch, getState) {
    if (storeHasInitialized) return
    const contacts = await getContactsWithMessages()

    dispatch(setAllContacts(contacts))

    storeHasInitialized = true
  }
}
