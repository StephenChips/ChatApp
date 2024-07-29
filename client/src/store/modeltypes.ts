export type User = {
  id: string;
  name: string;
  avatarURL: string;
};

type Text = {
  type: "text";
  text: string;
};

type Image = {
  type: "image";
  imageURL: string;
};

type CommonMessageProps = {
  id: number;
  senderID: User["id"];
  status: "succeeded" | "sending" | "failed";
  sendTime: string; // UTC time in ISO string format.
};

export type TextMessage = CommonMessageProps & Text;
export type ImageMessage = CommonMessageProps & Image;

export type Message = TextMessage | ImageMessage;

export type Contact = {
  user: User;
  messages: Message[];
};

type CommonNotificationProps = {
  id: number;
  createdAt: string; // UTC time in ISO format
  hasRead: boolean,
};

export type RequestStatus = "agreed" | "rejected" | "pending" | "expired";

export type AddContactRequest = {
  id: number,
  fromUser: User;
  toUser: User;
  requestStatus: RequestStatus;
};

export type AddContactRequestNotification = CommonNotificationProps & {
  type: "add contact request";
  request: AddContactRequest;
};

export type Notification = AddContactRequestNotification;
