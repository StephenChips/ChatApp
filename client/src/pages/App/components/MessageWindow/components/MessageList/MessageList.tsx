import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Chip, CircularProgress } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

import { Message, TextMessage } from "../../../../../../store/modeltypes";
import { useAppSelector } from "../../../../../../store";
import { selectAppUser } from "../../../../../../store/appUser";

import cls from "./MessageList.module.css";

export type MessageListProps = {
  fetchLimits: number;
  messages: Message[];
  noMoreMessages: boolean;
  onNoMoreMessages: (value: boolean) => void;
  onSetMessages: (messages: Message[]) => void;
  onFetchMessages: () => Promise<Message[]>;
};

export const MessageList = forwardRef<HTMLElement, MessageListProps>(function (
  props: MessageListProps,
  ref,
) {
  const propsRef = useRef<MessageListProps>(props);
  const scrollTopRef = useRef<number>(0);
  const intersectionObserverRef = useRef<IntersectionObserver | null>();
  const messageListElementRef = useRef<HTMLDivElement>(null);
  const messageListHeadElementRef = useRef<HTMLDivElement>(null);
  const [taskThatRestoreScrollPosition, setTaskThatRestoreScrollPosition] =
    useState<
      | { previousCanScroll: false }
      | {
          previousCanScroll: true;
          previousFirstMessageID: number;
          previousFirstMessageOffsetTop: number;
          previousScrollTop: number;
        }
      | null
    >();

  useImperativeHandle(ref, () => messageListElementRef.current!, []);

  propsRef.current = props;

  const messageRows = props.messages.map((message, index) => {
    const className = index === 0 ? cls["first"] : "";
    return <Row message={message} className={className} key={message.id}></Row>;
  });

  useEffect(() => {
    if (!propsRef.current.noMoreMessages) {
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
            setTaskThatRestoreScrollPosition({
              previousCanScroll: false,
            });
          } else {
            const subPixelPerciseOffsetTop =
              firstMessageEl.getBoundingClientRect().top -
              wrapperEl.getBoundingClientRect().top +
              wrapperEl.scrollTop;

            // Store necessary information for restoring scroll position after re-render.
            setTaskThatRestoreScrollPosition({
              previousCanScroll: true,
              previousFirstMessageID: propsRef.current.messages[0].id,
              previousFirstMessageOffsetTop: subPixelPerciseOffsetTop,
              previousScrollTop: scrollTopRef.current!,
            });
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
    }

    return () => {
      intersectionObserverRef.current?.disconnect();
      intersectionObserverRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (!taskThatRestoreScrollPosition) return;
    const messageListEl = messageListElementRef.current!;

    const { previousCanScroll } = taskThatRestoreScrollPosition;

    /**
     * Corner case:
     *
     * If before insertion the message list is too short to
     * be scrolled, but it become scrollable after insertion,
     * we should still scroll the list to the bottom, but not
     * restore the position base on the first messages in the
     * previous message list. Otherwise we will set the message
     * list's scroll offset mistakenly.
     */

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
      messageListEl.scrollTop = messageListEl.scrollHeight;
    }

    if (!props.noMoreMessages) {
      intersectionObserverRef.current!.observe(
        messageListHeadElementRef.current!,
      );
    }

    setTaskThatRestoreScrollPosition(null);
  }, [props.noMoreMessages, taskThatRestoreScrollPosition]);

  useLayoutEffect(() => {
    const messageListEl = messageListElementRef.current!;
    messageListEl.scrollTop = messageListEl.scrollHeight;
  }, []);

  return (
    <div className={cls["message-list"]} ref={messageListElementRef}>
      <div
        className={cls["message-list-scroll"]}
        onScroll={(event) => {
          scrollTopRef.current = (event.target as Element).scrollTop;
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
});

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
