import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "."
import { User } from "./modeltypes"

export type UserStore = {
  appUser?: User
}

const initialState: UserStore = {
  appUser: {
    id: 0,
    name: "John Wick",
    avatarURL: "https://fastly.picsum.photos/id/469/50/50.jpg?hmac=Wf4YHv-NPz_PHpK4sTzxM9tro8-_pomifQGnTv15x1E"
  }
}

const usersSlice = createSlice({
  name: "appUser",
  initialState,
  reducers: {
    setAppUser(state, { payload: appUser }: PayloadAction<User>) {
      state.appUser = appUser
    }
  }
})

export const selectAppUser = (state: RootState) => state.appUser.appUser

export const { setAppUser } = usersSlice.actions

export default usersSlice.reducer