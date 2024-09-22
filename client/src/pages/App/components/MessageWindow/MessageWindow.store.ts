import {
  createEntityAdapter,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";
import { RootState } from "../../../../store";

export type MessageWindowState = {
  id: string;
  taskThatRestoreScrollPosition:
    | { previousCanScroll: false }
    | {
        previousCanScroll: true;
        previousFirstMessageID: number;
        previousFirstMessageOffsetTop: number;
        previousScrollTop: number;
      }
    | null;

  textInput: string;

  // We don't know anything about scrolling until we render
  // the initial messages to the list, then we can get these
  // info from the DOM element.
  scrollOffset: number;
  hasScrolledToBottom: boolean;
  hasLoadedMessages: boolean;
};

const adapter = createEntityAdapter<MessageWindowState>();

const store = createSlice({
  name: "App/MessageWindow",
  initialState: adapter.getInitialState(),
  reducers: {
    addMessageWindow: adapter.addOne,
    setMessageWindowScrollOffset(
      state,
      {
        payload: { id, scrollOffset },
      }: PayloadAction<{
        id: MessageWindowState["id"];
        scrollOffset: MessageWindowState["scrollOffset"];
      }>,
    ) {
      state.entities[id].scrollOffset = scrollOffset;
    },
    setMessageWindowHasScrolledToBottom(
      state,
      {
        payload: { id, hasScrolledToBottom },
      }: PayloadAction<{
        id: MessageWindowState["id"];
        hasScrolledToBottom: MessageWindowState["hasScrolledToBottom"];
      }>,
    ) {
      state.entities[id].hasScrolledToBottom = hasScrolledToBottom;
    },
    setMessageWindowTasksThatRestoreScrollOffset(
      state,
      {
        payload: { id, task },
      }: PayloadAction<{
        id: MessageWindowState["id"];
        task: MessageWindowState["taskThatRestoreScrollPosition"];
      }>,
    ) {
      state.entities[id].taskThatRestoreScrollPosition = task;
    },

    setMessageWindowTextInput(
      state,
      {
        payload: { id, textInput }
      }: PayloadAction<{
        id: MessageWindowState["id"],
        textInput: MessageWindowState["textInput"]
      }>
    ) {
      state.entities[id].textInput = textInput
    },

    setMessageWindowHasLoadedMessages(
      state,
      {
        payload: { id, hasLoadedMessages }
      }: PayloadAction<{
        id: MessageWindowState["id"],
        hasLoadedMessages: MessageWindowState["hasLoadedMessages"]
      }>
    ) {
      state.entities[id].hasLoadedMessages = hasLoadedMessages;
    }
  },
});

export function createInitialMessageWindowState(
  id: MessageWindowState["id"],
): MessageWindowState {
  return {
    id,
    taskThatRestoreScrollPosition: null,
    textInput: "",
    hasScrolledToBottom: false,
    scrollOffset: 0,
    hasLoadedMessages: false,
  };
}

export const {
  addMessageWindow,
  setMessageWindowTextInput,
  setMessageWindowScrollOffset,
  setMessageWindowHasScrolledToBottom,
  setMessageWindowHasLoadedMessages,
  setMessageWindowTasksThatRestoreScrollOffset,
} = store.actions;

const selectors = adapter.getSelectors<RootState>(
  (state) => state.messageWindow,
);

export const { selectById: selectMessageWindowByID } = selectors;

export default store.reducer;
