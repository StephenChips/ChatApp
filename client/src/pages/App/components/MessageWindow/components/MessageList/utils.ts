import { Message } from "../../../../../../store/modeltypes";

export const createInitialListState = ({
  messages,
}: {
  messages: Message[];
}) => ({
  messages,
  scrollOffset: 0,
  noMoreMessages: false,
});

export function scrollToBottom(
  element: Element,
  behavior: ScrollBehavior = "instant",
) {
  element.scrollTo({
    left: 0,
    top: element.scrollHeight,
    behavior,
  });
}

export function hasScrolledToBottom(element: Element) {
  const { scrollTop, clientHeight, scrollHeight } = element;
  return Math.abs(scrollTop + clientHeight - scrollHeight) <= 5;
}
