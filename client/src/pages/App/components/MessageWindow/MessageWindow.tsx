import React, { useEffect, useRef } from "react";
import {
  IconButton,
  Zoom,
  Fab,
  Theme,
  useMediaQuery,
  styled,
} from "@mui/material";
import { ExpandMore, Close as CloseIcon } from "@mui/icons-material";

import { useAppDispatch, useAppSelector } from "../../../../store";
import { selectAppUser, selectLogInToken } from "../../../../store/appUser";
import { Contact } from "../../../../store/modeltypes";

import {
  selectContactByUserID,
  addMessage,
  FETCH_LIMITS,
  setContactMessages,
  setNoMoreMessages,
} from "../../../../store/contacts";
import { useNavigate, useParams } from "react-router";
import { getSocket } from "../../../../socket";
import {
  MessageList,
  MessageListRef,
} from "./components/MessageList/MessageList";
import axios from "axios";

import cls from "./MessageWindow.module.css";
import {
  addMessageWindow,
  createInitialMessageWindowState,
  selectMessageWindowByID,
  setMessageWindowTextInput,
} from "./MessageWindow.store";

const SendingButton = styled("button")(({ theme }) => ({
  backgroundColor: "transparent",
  color: theme.palette.primary.main,
  border: "none",
  height: "100%",
  paddingLeft: "10px",
  paddingRight: "15px",
  fontStyle: "italic",
  fontWeight: "bold",
  cursor: "pointer",
  "&[disabled]": {
    color: theme.palette.grey[500],
  },
}));

export function MessageWindow() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isViewportWiderThanLargeBreakpoint = useMediaQuery((theme: Theme) =>
    theme.breakpoints.up("lg"),
  );
  const headerContentWidth = isViewportWiderThanLargeBreakpoint
    ? "70%"
    : "calc(100% - 30px)";
  const messageListWidth = isViewportWiderThanLargeBreakpoint
    ? "70%"
    : "calc(100% - 90px)";
  const messageInputBoxWidth = isViewportWiderThanLargeBreakpoint
    ? "70%"
    : "calc(100% - 30px)";

  const currentContactID = useParams().userID!;

  const appUser = useAppSelector(selectAppUser);
  const logInToken = useAppSelector(selectLogInToken);
  const currentContact = useAppSelector((state) =>
    selectContactByUserID(state, currentContactID),
  );
  const currentMessageWindowID = `contact-${currentContactID}`;
  const currentMessageWindow = useAppSelector((state) =>
    selectMessageWindowByID(state, currentMessageWindowID),
  );

  const currentContactRef = useRef<Contact | null>(null);
  currentContactRef.current = currentContact;

  const messageListRef = useRef<MessageListRef | null>(null);

  useEffect(() => {
    if (currentMessageWindow) return;
    dispatch(
      addMessageWindow(createInitialMessageWindowState(currentMessageWindowID)),
    );
  }, [dispatch, currentMessageWindow, currentMessageWindowID]);

  if (!currentContact) {
    return (
      <div
        className={cls["message-window"]}
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className={cls["empty-message-window-prompt"]}>
          Pick a contact and start messaging.
        </div>
      </div>
    );
  }

  if (!currentMessageWindow) return null;

  const { textInput, hasScrolledToBottom } = currentMessageWindow;

  return (
    <div className={cls["message-window"]}>
      <div className={cls["message-window-header"]}>
        <div
          className={cls["message-window-header-content"]}
          style={{ width: headerContentWidth }}
        >
          <img
            className={cls["their-avatar-img"]}
            src={currentContact.user.avatarURL}
          />
          <span className={cls["their-name"]}>{currentContact.user.name}</span>
          <div className={cls["buttons"]}>
            <IconButton aria-label="close" onClick={onCloseMessageWindow}>
              <CloseIcon />
            </IconButton>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: isViewportWiderThanLargeBreakpoint
            ? `calc((100% - ${messageListWidth}) / 2 - 80px)`
            : "15px",
          bottom: "90px",
        }}
      >
        <Zoom in={!hasScrolledToBottom}>
          <Fab
            size="medium"
            color="primary"
            onClick={() => {
              messageListRef.current?.scrollToBottom();
            }}
          >
            <ExpandMore />
          </Fab>
        </Zoom>
      </div>
      <MessageList
        ref={messageListRef}
        width={messageListWidth}
        messageWindowID={currentMessageWindowID}
        fetchLimits={FETCH_LIMITS}
        messages={currentContact.messages}
        noMoreMessages={currentContact.noMoreMessages}
        onNoMoreMessages={() => {
          dispatch(
            setNoMoreMessages({
              contactUserID: currentContact.user.id,
              value: true,
            }),
          );
        }}
        onSetMessages={(messages) => {
          dispatch(
            setContactMessages({
              contactUserID: currentContact.user.id,
              messages,
            }),
          );
        }}
        onFetchMessages={async () => {
          const response = await axios({
            url: "/api/getContactMessages",
            method: "POST",
            headers: {
              Authorization: `Bearer ${logInToken}`,
            },
            data: {
              contactUserID: currentContact.user.id,
              offset: currentContact.messages.length,
              limit: FETCH_LIMITS,
            },
          });

          return response.data.messages;
        }}
      />
      <form
        className={cls["message-inputbox"]}
        style={{
          width: messageInputBoxWidth,
        }}
        onSubmit={handleSendingText}
      >
        <input type="text" value={textInput} onChange={handleInputtingText} />
        <SendingButton type="submit" disabled={textInput === ""}>
          SEND
        </SendingButton>
      </form>
    </div>
  );

  function handleInputtingText(e: React.ChangeEvent<HTMLInputElement>) {
    dispatch(
      setMessageWindowTextInput({
        id: currentMessageWindowID,
        textInput: e.target.value,
      }),
    );
  }

  async function handleSendingText(e: React.FormEvent) {
    e.preventDefault();

    const msg = {
      type: "text",
      text: textInput,
      senderID: appUser!.id,
      recipientID: currentContactID,
    };

    const message = await sendMessageToServer(msg)
      .then((msg) => ({ ...msg, status: "succeeded" }))
      .catch((e) => {
        console.error(e);
        return { ...msg, status: "failed" };
      });

    await dispatch(addMessage(msg.recipientID, message));

    dispatch(
      setMessageWindowTextInput({
        id: currentMessageWindowID,
        textInput: "",
      }),
    );

    messageListRef.current?.scrollToBottom();
  }

  async function sendMessageToServer(message: unknown) {
    const io = getSocket()!;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Promise<any>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      io.emit("im/message", message, (error: any, sentMessage: any) => {
        if (error) reject(error);
        else resolve(sentMessage);
      });
    });
  }

  function onCloseMessageWindow() {
    navigate("/");
  }
}
