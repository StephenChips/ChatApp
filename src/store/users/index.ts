import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit"
import dummyImg from "../../assets/1022-100x100.jpg"
import { RootState } from ".."

export type User = {
  id: number
  name: string
  avatarURL: string
}

export type UserStore = {
  ids: User["id"][]
  entities: { [key: User["id"]]: User }
}

const usersAdapter = createEntityAdapter<User>({
  sortComparer: (a, b) => a.id - b.id
})

type UserStoreState = EntityState<User, number> & { loginedUser?: User }

const initialState: UserStoreState = usersAdapter.getInitialState(
  {
    loginedUserID: 0
  },
  [
    {
      id: 0,
      name: "Abraham M. Graham",
      avatarURL: dummyImg
    },
    {
      id: 1,
      name: "Guang Tuan",
      avatarURL: dummyImg
    },
    {
      id: 2,
      name: "Shuang Hê",
      avatarURL: dummyImg
    },
    {
      id: 3,
      name: "Philip Riel",
      avatarURL: dummyImg
    },
    {
      id: 4,
      name: "Ellie Matthews",
      avatarURL: dummyImg
    },
    {
      id: 5,
      name: "Zygmunt Kowalczyk",
      avatarURL: dummyImg
    },
    {
      id: 6,
      name: "Abraham M. Graham",
      avatarURL: dummyImg
    },
    {
      id: 7,
      name: "Guang Tuan",
      avatarURL: dummyImg
    },
    {
      id: 8,
      name: "Shuang Hê",
      avatarURL: dummyImg
    },
    {
      id: 9,
      name: "Philip Riel",
      avatarURL: dummyImg
    },
    {
      id: 10,
      name: "Ellie Matthews",
      avatarURL: dummyImg
    }
  ]
)

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    addUsers: usersAdapter.addOne,
    setAppUser(state, { payload: appUser }: PayloadAction<User>) {
      state.loginedUser = appUser
    },
    unsetAppUser(state) {
      state.loginedUser = undefined
    }
  }
})

export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds
} = usersAdapter.getSelectors<RootState>(state => state.users)

export const { addUsers } = usersSlice.actions

export default usersSlice.reducer