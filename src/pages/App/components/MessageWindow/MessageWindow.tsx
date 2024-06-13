import React, { useState } from "react"
import cls from "./MessageWindow.module.css"
import CircularProgress from "@mui/material/CircularProgress"
import DoneIcon from "@mui/icons-material/Done"
import ErrorIcon from "@mui/icons-material/Error"
import { useAppStore } from "../../../../store"
import { selectAppUser } from "../../../../store/appUser"
import { Contact, Message, TextMessage } from "../../../../store/modeltypes"
import { IconButton } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"

type RowProps = {
  message: Message
  className?: string
}

type TextBubbleProp = {
  message: TextMessage
  className?: string
}

function TextBubble({ message, className = "" }: TextBubbleProp) {
  className += " " + cls["text-bubble"]

  return (
    <div className={className}>
      {message.text}
    </div>
  )
}

function Row({ message, className }: RowProps) {
  const store = useAppStore()
  const appUser = selectAppUser(store.getState())

  className += " " + cls["row"]

  let rowContentClassName

  // TODO zero is just a dummy value

  if (message.senderID === appUser!.id) {
    className += " " + cls["my-message"]
    rowContentClassName = cls["my-message"]
  } else {
    className += " " + cls["their-message"]
    rowContentClassName = cls["their-message"]
  }

  let rowContent, messageStatus

  if (message.type === "text") {
    rowContent = <TextBubble message={message} className={rowContentClassName} />
  } else {
    rowContent = <div></div>
  }

  if (message.senderID === appUser!.id) {
    switch (message.status) {
      case "succeeded":
        messageStatus = <DoneIcon style={{ color: "#007ba8", marginRight: 2 }} fontSize="small" />
        break
      case "sending":
        messageStatus = <CircularProgress style={{ marginRight: 6 }} size={15} />
        break
      case "failed":
        messageStatus = <ErrorIcon style={{ color: "red", marginRight: 2 }} fontSize="small" />
        break
    }
  } else {
    messageStatus = <div></div>
  }

  return (
    <div className={className} key={message.id}>
      <div className={cls["message-status"]}>{messageStatus}</div>
      {rowContent}
    </div>
  )
}

type MessageWindowProps = {
  contact?: Contact,
  onSendText: (text: string) => void
  onCloseMessageWindow: () => void
}

export function MessageWindow({ contact, onSendText, onCloseMessageWindow }: MessageWindowProps) {
  const [textInput, setTextInput] = useState("")

  if (!contact) {
    return <div className={cls["message-window"]} style={{
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div className={cls["empty-message-window-prompt"]}>Pick a contact and start messaging.</div>
    </div>
  }

  const messageRows = contact.messages.map((message, index) => {
    const className = index === 0 ? cls["first"] : ""
    return <Row message={message} className={className} key={message.id}></Row>
  })

  return (
    <div className={cls["message-window"]}>
      <div className={cls["message-window-header"]}>
        <div className={cls["message-window-header-content"]}>
          <img className={cls["their-avatar-img"]} src={contact.user.avatarURL} />
          <span className={cls["their-name"]}>{contact.user.name}</span>
          <div className={cls["buttons"]}>
            <IconButton aria-label="close" onClick={onCloseMessageWindow}>
              <CloseIcon />
            </IconButton>
          </div>
        </div>
      </div>
      <div className={cls["message-list"]}>
        {messageRows}
      </div>
      <form className={cls["message-inputbox"]} onSubmit={handleSendingText}>
        <input type="text" value={textInput} onChange={handleInputtingText} />
        <button type="submit" className={cls["sending-button"]}>
          SEND
        </button>
      </form>
    </div>
  )

  function handleSendingText(e: React.FormEvent) {
    e.preventDefault()
    onSendText(textInput)
    setTextInput("")
  }

  function handleInputtingText(e: React.ChangeEvent<HTMLInputElement>) {
    setTextInput(e.target.value)
  }

}
