import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import cls from "./MessageWindow.module.css";
import CircularProgress from "@mui/material/CircularProgress";
import ErrorIcon from "@mui/icons-material/Error";
import Fab from "@mui/material/Fab";
import { useAppDispatch, useAppSelector, useAppStore } from "../../../../store";
import { selectAppUser, selectLogInToken } from "../../../../store/appUser";
import { Message, TextMessage } from "../../../../store/modeltypes";
import { Chip, IconButton, Zoom } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  selectContactByUserID,
  addMessage,
  setNoMoreMessages,
  prependMessages,
  FETCH_LIMITS,
} from "../../../../store/contacts";
import { useNavigate, useParams } from "react-router";
import { getSocket } from "../../../../socket";
import { ExpandMore } from "@mui/icons-material";
import axios from "axios";

type RowProps = {
  message: Message;
  className?: string;
};

type TextBubbleProp = {
  message: TextMessage;
  className?: string;
};

function TextBubble({ message, className = "" }: TextBubbleProp) {
  className += " " + cls["text-bubble"];

  return <div className={className}>{message.text}</div>;
}

function Row({ message, className }: RowProps) {
  const store = useAppStore();
  const appUser = selectAppUser(store.getState());

  className += " " + cls["row"];

  let rowContentClassName;

  // TODO zero is just a dummy value

  if (message.senderID === appUser!.id) {
    className += " " + cls["my-message"];
    rowContentClassName = cls["my-message"];
  } else {
    className += " " + cls["their-message"];
    rowContentClassName = cls["their-message"];
  }

  let rowContent, messageStatus;

  if (message.type === "text") {
    rowContent = (
      <TextBubble message={message} className={rowContentClassName} />
    );
  } else {
    rowContent = <div></div>;
  }

  if (message.senderID === appUser!.id) {
    switch (message.status) {
      case "succeeded":
        messageStatus = null;
        break;
      case "sending":
        messageStatus = (
          <CircularProgress style={{ marginRight: 6 }} size={15} />
        );
        break;
      case "failed":
        messageStatus = (
          <ErrorIcon
            style={{ color: "red", marginRight: 2 }}
            fontSize="small"
          />
        );
        break;
    }
  } else {
    messageStatus = <div></div>;
  }

  return (
    <div className={className} data-message-id={message.id} key={message.id}>
      <div className={cls["message-status"]}>{messageStatus}</div>
      {rowContent}
    </div>
  );
}

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
  const setScrollOffsetJobRef = useRef<
    | { tooFewMessagesToScroll: true }
    | {
        tooFewMessagesToScroll: false;
        previousFirstMessageID: number;
        previousFirstMessageOffsetTop: number;
        previousScrollOffset: number;
      }
    | null
  >();

  const scrollOffsetRef = useRef<number>(0);
  const intersectionObserverRef = useRef<IntersectionObserver>();
  const messageListWrapperElementRef = useRef<HTMLDivElement>(null);
  const messageListHeadElementRef = useRef<HTMLDivElement>(null);
  const currentMessagesRef = useRef<Message[] | null>(null);

  currentMessagesRef.current = currentContact?.messages;

  /**
   * REFRACTORATION:
   * 
   * The effects relative to the message list depend on the `currentContact`.
   * Some of its properties are not relative to these effects, or isn't the
   * direct cause to re-run these effects.
   * 
   * WHAT SHOULD WE DO?
   * 
   * We should wrap these effects and the DOM that is for displaying a
   * message list into a new component, namely <MessageList />.
   * */

  // Following effects depends on the `currentContact` state.
  // When `currentContact` changes, these effects will rerun.
  //
  // Cases causes `currentContact` to be changed?
  //    1. When users open or close a message window
  //    2. When users switch current contact
  //    3. When setting (e.g. prepending) new messages
  //    4. When setting noMoreNewMessages
  //    5. When contact is updated 

  useEffect(() => {
    // EFFECT THAT REGISTERS A SCROLL EVENT TO THE LIST WRAPPER ELEMENT
    // UNREGISTER ON RERUNNING THE EFFECT
    //
    // When should this effect run?
    // 1. When the `messageListWrapperElement` is attached to the DOM.
    // 2. (cleanup function runs) When `messageListWrapperElement` is removed from the DOM.
    //
    // When is `messageListWrapperElement` attached to the DOM:
    //     When setting `currentContact` from `null` to any non-`null` value.
    //     That is, when users select a contact and open the message window (previous they haven't select any contact).
    // 
    // Vice-versa, when users close the message window, and the `currentContact` become `null`,
    // the effect will run again.
    //
    // Conclusion:
    // This effect should only run in the cases of 1 and 2. In the other cases are unnecessary.
    // Although rerunning it won't cause any bug.

    if (!currentContact) return;
    const messageListWrapperEl = messageListWrapperElementRef.current!;

    scrollOffsetRef.current = messageListWrapperEl.scrollTop;

    const onScroll = () => {
      scrollOffsetRef.current = messageListWrapperEl.scrollTop;
    };

    messageListWrapperEl.addEventListener("scroll", onScroll);
    return () => {
      messageListWrapperEl.removeEventListener("scroll", onScroll);
    };
  }, [currentContact]);

  useEffect(() => {
    // EFFECT THAT creates the IntersectionObserver.
    //
    // Like the previous effect, it should run in the cases of 1 and 2.
    // Also should runs after we prepending new messages (case 3).
    // Unneccssary but no harm to run in the other cases.

    if (!currentContact) return;
    if (!intersectionObserverRef.current) {
      intersectionObserverRef.current = new IntersectionObserver(
        async (entries) => {
          const wrapperEl = messageListWrapperElementRef.current!;
          const listHeadEl = messageListHeadElementRef.current!;
          const firstMessageEl =
            messageListWrapperElementRef.current!.querySelector(
              `.${cls["row"]}`,
            ) as HTMLElement;

          const listHeadElementEntry = entries.find(
            ({ target }) => target === listHeadEl,
          )!;

          if (!listHeadElementEntry.isIntersecting) return;

          const {
            data: { messages },
          } = await axios({
            url: "/api/getContactMessages",
            method: "POST",
            headers: {
              Authorization: `Bearer ${logInToken}`,
            },
            data: {
              contactUserID: currentContact.user.id,
              offset: currentMessagesRef.current!.length,
              limit: FETCH_LIMITS,
            },
          });

          if (messages.length === 0) {
            intersectionObserverRef.current!.unobserve(listHeadEl);
          }

          if (wrapperEl.clientHeight === wrapperEl.scrollHeight) {
            setScrollOffsetJobRef.current = { tooFewMessagesToScroll: true };
          } else {
            // Calculate a sub-pixel percise `firstMessageEl.offsetTop` value.
            const firstMessageOffsetTop =
              firstMessageEl.getBoundingClientRect().top -
              wrapperEl.getBoundingClientRect().top +
              wrapperEl.scrollTop;

            setScrollOffsetJobRef.current = {
              tooFewMessagesToScroll: false,
              previousFirstMessageID: currentMessagesRef.current![0].id,
              previousFirstMessageOffsetTop: firstMessageOffsetTop,
              previousScrollOffset: scrollOffsetRef.current!,
            };
          }

          if (messages.length < FETCH_LIMITS) {
            dispatch(
              setNoMoreMessages({
                contactUserID: currentContact.user.id,
                value: true,
              }),
            );
          }

          if (messages.length > 0) {
            dispatch(
              prependMessages({
                contactUserID: currentContact.user.id,
                messages,
              }),
            );
          }

          // The component will re-render, and after re-rendering, we will fire a layout effect to recalculate
          // the scroll offset, and observe the new leading element.
        },
        { root: messageListWrapperElementRef.current!, threshold: 0 },
      );
    }

    intersectionObserverRef.current!.disconnect();
    intersectionObserverRef.current!.observe(
      messageListHeadElementRef.current!,
    );

    return () => {
      intersectionObserverRef.current?.disconnect();
      intersectionObserverRef.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContact]);

  useLayoutEffect(() => {
    // This effect should only run when the component is first created, after the initial messages
    // are displayed in the DOM. In other word, it should run in the cases of 1 and 2, but not in other
    // cases.
    //
    // In the other cases running it will cause bug.
    // (Unneccessarily scroll the list to the end instantly, which may cause glitch).
    if (!currentContact) return;
    scrollMessageListToBottom();
  }, [currentContact]);

  useLayoutEffect(() => {
    // This effect is for setting the scroll position after inserting new data to the start of the message list.
    //
    // When should this effect run? When we insert new data to the start of the message list (case 3).
    // In the other cases it will run but thanks to the if guard this effect will do nothing, therefore won't
    // cause bugs.
    const previous = setScrollOffsetJobRef.current;
    if (!currentContact || !previous) return; // if guard.
    const messageListWrapperElement = messageListWrapperElementRef.current!;

    if (previous.tooFewMessagesToScroll) {
      scrollMessageListToBottom("instant");
    } else {
      const previousFirstMessage = messageListWrapperElement.querySelector(
        `[data-message-id="${previous.previousFirstMessageID}"]`,
      );

      previousFirstMessage!.scrollIntoView({
        behavior: "instant",
        block: "start",
        inline: "nearest",
      });

      messageListWrapperElement.scrollTop -= previous.previousFirstMessageOffsetTop;
      messageListWrapperElement.scrollTop += previous.previousScrollOffset;
    }

    setScrollOffsetJobRef.current = null;
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

  const messageRows = currentContact.messages?.map((message, index) => {
    const className = index === 0 ? cls["first"] : "";
    return <Row message={message} className={className} key={message.id}></Row>;
  });

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
      <div
        className={cls["message-list-wrapper"]}
        ref={messageListWrapperElementRef}
        onScroll={onScrollMessageList}
      >
        <div className={cls["message-list"]}>
          <div
            ref={messageListHeadElementRef}
            style={{
              display: messageRows ? "flex" : "none",
              justifyContent: "center",
              alignItems: "center",
              height: "60px",
            }}
          >
            {currentContact.noMoreMessages ? (
              <Chip label="No more messages" />
            ) : (
              <>
                <CircularProgress size={20} color="secondary" />
              </>
            )}
          </div>
          {messageRows}
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

    scrollMessageListToBottom();
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

  function onScrollMessageList(event: React.UIEvent) {
    const messageListWrapperEl = event.target as Element;

    if (hasScrolledToBottom()) {
      setIsScrollToEndButtonVisible(false);
    } else {
      setIsScrollToEndButtonVisible(true);
    }

    function hasScrolledToBottom() {
      const { scrollTop, clientHeight, scrollHeight } = messageListWrapperEl;
      return Math.abs(scrollTop + clientHeight - scrollHeight) <= 5;
    }
  }

  function scrollMessageListToBottom(behavior: ScrollBehavior = "instant") {
    const messageListWrapperEl = messageListWrapperElementRef.current!;
    messageListWrapperEl.scrollTo({
      left: 0,
      top: messageListWrapperEl.scrollHeight,
      behavior,
    });
  }
}
