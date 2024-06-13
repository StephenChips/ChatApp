 export type User = {
  id: number
  name: string
  avatarURL: string
}

type Text = {
  type: "text"
  text: string
}

type Image = {
  type: "image"
  imageURL: string
}

type CommonMessageProps = {
  id: number
  senderID: User["id"]
  status: "succeeded" | "sending" | "failed"
  sendTime: string // UTC time in ISO string format.
}

export type TextMessage = CommonMessageProps & Text
export type ImageMessage = CommonMessageProps & Image

export type Message =
  | TextMessage
  | ImageMessage

export type Contact = {
  user: User
  messages: Message[]
}