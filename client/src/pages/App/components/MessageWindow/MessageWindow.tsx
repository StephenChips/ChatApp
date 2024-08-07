import React, { useState } from "react";
import { omit } from "lodash";
import cls from "./MessageWindow.module.css";
import CircularProgress from "@mui/material/CircularProgress";
import DoneIcon from "@mui/icons-material/Done";
import ErrorIcon from "@mui/icons-material/Error";
import { useAppDispatch, useAppSelector, useAppStore } from "../../../../store";
import { selectAppUser } from "../../../../store/appUser";
import { Message, TextMessage } from "../../../../store/modeltypes";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  selectContactByUserID,
  addMessage,
  setMessageStatus,
} from "../../../../store/contacts";
import { useNavigate, useParams } from "react-router";
import { getSocket } from "../../../../socket";

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
        messageStatus = (
          <DoneIcon
            style={{ color: "#007ba8", marginRight: 2 }}
            fontSize="small"
          />
        );
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
    <div className={className} key={message.id}>
      <div className={cls["message-status"]}>{messageStatus}</div>
      {rowContent}
    </div>
  );
}

export function MessageWindow() {
  const appUser = useAppSelector(selectAppUser);
  const currentContactID = useParams().userID!;
  const currentContact = useAppSelector((state) =>
    selectContactByUserID(state, currentContactID),
  );
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [textInput, setTextInput] = useState("");

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

  const messageRows = currentContact.messages.map((message, index) => {
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
      <div className={cls["message-list"]}>{messageRows}</div>
      <form className={cls["message-inputbox"]} onSubmit={handleSendingText}>
        <input type="text" value={textInput} onChange={handleInputtingText} />
        <button type="submit" className={cls["sending-button"]} disabled={textInput === ""}>
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

    let status: Message["status"];

    const msg: Omit<TextMessage, "id"> = {
      type: "text",
      text: textInput,
      senderID: appUser!.id,
      recipientID: currentContactID,
      sentAt: new Date().toISOString(),
      status: "sending",
    };

    const id = await dispatch(addMessage(msg.recipientID, msg));

    try {
      await sendMessageToServer({ ...msg, id });
      status = "succeeded";
    } catch {
      status = "failed";
    }
    
    await dispatch(setMessageStatus(id, status));

    setTextInput("");
  }

  async function sendMessageToServer<T extends Message>(message: T) {
    const io = getSocket()!;
    const msg = omit(message, "id", "status");
    await io.emitWithAck("im/message", msg);
  }

  function onCloseMessageWindow() {
    navigate("/");
  }
}
