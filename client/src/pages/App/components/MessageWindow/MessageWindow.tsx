import React, { useEffect, useRef, useState } from "react";
import { IconButton, Zoom, Fab } from "@mui/material";
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
import { MessageList } from "./components/MessageList/MessageList";
import {
  hasScrolledToBottom,
  scrollToBottom,
} from "./components/MessageList/utils";
import axios from "axios";

import cls from "./MessageWindow.module.css";

export function MessageWindow() {
  const appUser = useAppSelector(selectAppUser);
  const logInToken = useAppSelector(selectLogInToken);

  const currentContactID = useParams().userID!;
  const currentContact = useAppSelector((state) =>
    selectContactByUserID(state, currentContactID),
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [textInput, setTextInput] = useState("");
  const [isScrollToEndButtonVisible, setIsScrollToEndButtonVisible] =
    useState(false);

  const currentContactRef = useRef<Contact | null>(null);
  const messageListElementRef = useRef<HTMLElement | null>(null);

  currentContactRef.current = currentContact;

  useEffect(() => {
    const messageListEl = messageListElementRef.current;
    if (!messageListEl) return;

    const onScroll = () => {
      if (hasScrolledToBottom(messageListEl)) {
        setIsScrollToEndButtonVisible(false)
      } else {
        setIsScrollToEndButtonVisible(true)
      }
    };
    messageListEl.addEventListener("scroll", onScroll);
    return () => {
      messageListEl.removeEventListener("scroll", onScroll);
    };
  }, [currentContact]);

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

  return (
    <div className={cls["message-window"]}>
      <div className={cls["message-window-header"]}>
        <div className={cls["message-window-header-content"]}>
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

      <div className={cls["scroll-to-bottom-fab"]}>
        <Zoom in={isScrollToEndButtonVisible}>
          <Fab
            size="medium"
            color="primary"
            onClick={() => scrollMessageListToBottom("smooth")}
          >
            <ExpandMore />
          </Fab>
        </Zoom>
      </div>
      <MessageList
        ref={messageListElementRef}
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
      <form className={cls["message-inputbox"]} onSubmit={handleSendingText}>
        <input type="text" value={textInput} onChange={handleInputtingText} />
        <button
          type="submit"
          className={cls["sending-button"]}
          disabled={textInput === ""}
        >
          SEND
        </button>
      </form>
    </div>
  );

  function handleInputtingText(e: React.ChangeEvent<HTMLInputElement>) {
    setTextInput(e.target.value);
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

    setTextInput("");

    scrollMessageListToBottom("instant");
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

  function scrollMessageListToBottom(behavior: ScrollBehavior) {
    if (messageListElementRef.current) {
      scrollToBottom(messageListElementRef.current, behavior);
    }
  }
}
