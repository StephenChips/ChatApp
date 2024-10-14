import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { Chip, CircularProgress } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

import { Message, TextMessage } from "../../../../../../store/modeltypes";
import { useAppDispatch, useAppSelector } from "../../../../../../store";
import { selectAppUser } from "../../../../../../store/appUser";

import cls from "./MessageList.module.css";
import {
  selectMessageWindowByID,
  setMessageWindowTasksThatRestoreScrollOffset,
  setMessageWindowScrollOffset,
  setMessageWindowHasScrolledToBottom,
  setMessageWindowHasLoadedMessages,
} from "../../MessageWindow.store";
import { hasScrolledToBottom } from "./utils";

export type MessageListProps = {
  width: string;
  messageWindowID: string;
  fetchLimits: number;
  messages: Message[];
  noMoreMessages: boolean;
  onNoMoreMessages: (value: boolean) => void;
  onSetMessages: (messages: Message[]) => void;
  onFetchMessages: () => Promise<Message[]>;
};

export type MessageListRef = {
  scrollToBottom: () => void;
};

export const MessageList = forwardRef<MessageListRef, MessageListProps>(
  function (props: MessageListProps, ref) {
    const dispatch = useAppDispatch();
    const messageWindowState = useAppSelector((state) =>
      selectMessageWindowByID(state, props.messageWindowID),
    );

    const { taskThatRestoreScrollPosition, hasLoadedMessages, scrollOffset } =
      messageWindowState ?? {};

    const propsRef = useRef<MessageListProps>(props);
    propsRef.current = props;

    const scrollTopRef = useRef<number>(0);
    const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
    const messageListElementRef = useRef<HTMLDivElement>(null);
    const messageListHeadElementRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => {
      return {
        scrollToBottom() {
          if (!messageListElementRef.current) return;
          dispatch(
            setMessageWindowScrollOffset({
              id: props.messageWindowID,
              scrollOffset: messageListElementRef.current!.scrollHeight,
            }),
          );
        },
      };
    }, [dispatch, props.messageWindowID]);

    useEffect(() => {
      if (hasLoadedMessages) return;

      dispatch(
        setMessageWindowHasLoadedMessages({
          id: props.messageWindowID,
          hasLoadedMessages: true,
        }),
      );

      dispatch(
        setMessageWindowScrollOffset({
          id: props.messageWindowID,
          scrollOffset: messageListElementRef.current!.scrollHeight,
        }),
      );

      dispatch(
        setMessageWindowHasScrolledToBottom({
          id: props.messageWindowID,
          hasScrolledToBottom: true,
        }),
      );
    }, [dispatch, hasLoadedMessages, props.messageWindowID]);

    useEffect(() => {
      if (!hasLoadedMessages) return;
      messageListElementRef.current!.scrollTop = scrollOffset;
    }, [dispatch, hasLoadedMessages, scrollOffset]);

    // Effect that initialize the intersection observer. Inside the observer's handler
    // we test if users have scroll the list to the top edge, if so, it will load more
    // history messages into the list.
    useEffect(() => {
      if (props.noMoreMessages) return;
      if (!hasLoadedMessages) return;

      intersectionObserverRef.current = new IntersectionObserver(
        async (entries) => {
          const wrapperEl = messageListElementRef.current!;
          const listHeadEl = messageListHeadElementRef.current!;
          const firstMessageEl = messageListElementRef.current!.querySelector(
            `.${cls["row"]}`,
          ) as HTMLElement;

          const listHeadElementEntry = entries.find(
            (entry) => entry.target === listHeadEl,
          )!;

          if (!listHeadElementEntry.isIntersecting) return;
          const moreMessages = await propsRef.current.onFetchMessages();

          if (wrapperEl.scrollHeight === wrapperEl.clientHeight) {
            dispatch(
              setMessageWindowTasksThatRestoreScrollOffset({
                id: props.messageWindowID,
                task: {
                  previousCanScroll: false,
                },
              }),
            );
          } else {
            const subPixelPerciseOffsetTop =
              firstMessageEl.getBoundingClientRect().top -
              wrapperEl.getBoundingClientRect().top +
              wrapperEl.scrollTop;

            // Store necessary information for restoring scroll position after re-render.
            dispatch(
              setMessageWindowTasksThatRestoreScrollOffset({
                id: props.messageWindowID,
                task: {
                  previousCanScroll: true,
                  previousFirstMessageID: propsRef.current.messages[0].id,
                  previousFirstMessageOffsetTop: subPixelPerciseOffsetTop,
                  previousScrollTop: scrollTopRef.current!,
                },
              }),
            );
          }

          if (moreMessages.length < propsRef.current.fetchLimits) {
            propsRef.current.onNoMoreMessages(true);
          }

          if (moreMessages.length > 0) {
            propsRef.current.onSetMessages([
              ...moreMessages,
              ...propsRef.current.messages,
            ]);
          }

          intersectionObserverRef.current!.unobserve(listHeadEl);
        },
        { root: messageListElementRef.current!, threshold: 0 },
      );

      intersectionObserverRef.current.observe(
        messageListHeadElementRef.current!,
      );

      return () => {
        intersectionObserverRef.current?.disconnect();
        intersectionObserverRef.current = null;
      };
    }, [
      dispatch,
      hasLoadedMessages,
      props.messageWindowID,
      props.noMoreMessages,
    ]);

    useEffect(() => {
      intersectionObserverRef.current?.observe(
        messageListHeadElementRef.current!,
      );

      return () => {
        intersectionObserverRef.current?.disconnect();
      };
    }, [props.messages]);

    // Effect that restores the scrolling position after loading more history messages.
    useLayoutEffect(() => {
      if (!taskThatRestoreScrollPosition) return;

      const messageListEl = messageListElementRef.current!;

      const { previousCanScroll } = taskThatRestoreScrollPosition;

      if (previousCanScroll) {
        const {
          previousFirstMessageID,
          previousFirstMessageOffsetTop,
          previousScrollTop,
        } = taskThatRestoreScrollPosition;

        const previousFirstMessage = messageListEl.querySelector(
          `[data-message-id="${previousFirstMessageID}"]`,
        );

        previousFirstMessage!.scrollIntoView({
          behavior: "instant",
          block: "start",
          inline: "nearest",
        });

        messageListEl.scrollTop -= previousFirstMessageOffsetTop;
        messageListEl.scrollTop += previousScrollTop;
      } else {
        // If the list is too short to scroll and after getting
        // more messages we can scroll it, we should scroll the
        // list to the bottom.
        messageListEl.scrollTop = messageListEl.scrollHeight;
      }

      dispatch(
        setMessageWindowScrollOffset({
          id: props.messageWindowID,
          scrollOffset: messageListEl.scrollTop,
        }),
      );

      dispatch(
        setMessageWindowTasksThatRestoreScrollOffset({
          id: props.messageWindowID,
          task: null,
        }),
      );
    }, [dispatch, props.messageWindowID, taskThatRestoreScrollPosition]);

    // After loading new messages (user sends or receives a new message for example),
    // if the list has been scrolled to bottom before, it should remain at the bottom.
    //
    // The ONLY TRUE DEPENDENCY of this effect is `props.messages`. Other dependencies,
    // even though are used, when they are changed, doesn't cause any state of the view
    // to be changed. For example, when `props.messageWindowID` is changed, if the list
    // has been scrolled to the bottom end, it will set the scrolling position to the
    // bottom end again, which obviously is a no-op, and if it doesn't at the bottom end,
    // this effect will literally do nothing.
    useEffect(() => {
      if (!messageWindowState.hasScrolledToBottom) return;
      dispatch(
        setMessageWindowScrollOffset({
          id: props.messageWindowID,
          scrollOffset: messageListElementRef.current!.scrollHeight,
        }),
      );
    }, [
      dispatch,
      messageWindowState.hasScrolledToBottom,
      props.messageWindowID,
      props.messages,
    ]);

    const messageRows = props.messages.map((message, index) => {
      const className = index === 0 ? cls["first"] : "";
      return (
        <Row message={message} className={className} key={message.id}></Row>
      );
    });

    return (
      <div
        className={cls["message-list"]}
        ref={messageListElementRef}
        onScroll={onScroll}
      >
        <div
          className={cls["message-list-scroll"]}
          style={{
            width: props.width,
          }}
        >
          <div
            className={cls["message-list-head"]}
            ref={messageListHeadElementRef}
          >
            {props.noMoreMessages ? (
              <Chip label="No more messages" />
            ) : (
              <CircularProgress size={20} color="secondary" />
            )}
          </div>
          {messageRows}
        </div>
      </div>
    );

    function onScroll() {
      if (!messageListElementRef.current) return;
      console.log(hasScrolledToBottom(messageListElementRef.current))
      dispatch(
        setMessageWindowScrollOffset({
          id: props.messageWindowID,
          scrollOffset: messageListElementRef.current.scrollTop,
        }),
      );

      dispatch(
        setMessageWindowHasScrolledToBottom({
          id: props.messageWindowID,
          hasScrolledToBottom: hasScrolledToBottom(
            messageListElementRef.current,
          ),
        }),
      );
    }
  },
);

type TextBubbleProp = {
  message: TextMessage;
  className?: string;
};

function TextBubble({ message, className = "" }: TextBubbleProp) {
  className += " " + cls["text-bubble"];

  return <div className={className}>{message.text}</div>;
}

type RowProps = {
  message: Message;
  className?: string;
};

function Row({ message, className }: RowProps) {
  const appUser = useAppSelector(selectAppUser);

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
