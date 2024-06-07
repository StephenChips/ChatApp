import { useState } from "react"
import cls from "./MessageWindow.module.css"
import dummyImg from "../../../../assets/1022-100x100.jpg"


type User = {
    id: number,
    name: string
    avatarURL: string
}

type TextMessage = {
    type: "text"
    text: string
    user: User
    id: number
}

type ImageMessage = {
    type: "image"
    imageURL: string
    user: User
    id: number
}

type Message =
    | TextMessage
    | ImageMessage

type RowContentProps = {
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

function RowContent({ message }: RowContentProps) {
    let className = cls["row-content"]

    // TODO zero is just a dummy value

    if (message.user.id === 0) {
        className += " " + cls["my-message"]
    } else {
        className += " " + cls["their-message"]
    }

    if (message.type === "text") {
        return <TextBubble message={message} className={className}/>
    } else {
        return ""
    }
}

export function MessageWindow() {
    const [their] = useState<User>({
        id: 1,
        name: "Guan Tuan",
        avatarURL: dummyImg
    })

    const [messageList] = useState<Message[]>([
        {
            user: {
                id: 0,
                name: "johc",
                avatarURL: dummyImg
            },
            type: "text",
            text: "hello, valk",
            id: 0,
        },
        {
            user: {
                id: 1,
                name: "valk",
                avatarURL: dummyImg
            },
            type: "text",
            text: "hello, johc",
            id: 1,
        }
    ])

    const rowElements = messageList.map((msg, index) => {
        let className = cls["row-content-wrapper"]
        if (index === 0) className += ` ${cls["first"]}`

        return (
            <div className={className} key={msg.id}>
                <RowContent message={msg} />
            </div>
        )
    })
    
    return (
        <div className={cls["message-window"]}>
            <div className={cls["message-window-header"]}>
                <div className={cls["message-window-header-content"]}>
                    <img className={cls["their-avatar-img"]} src={their.avatarURL} />
                    <span className={cls["their-name"]}>{their.name}</span>
                </div>
            </div>
            <div className={cls["message-list"]}>
                {rowElements}
            </div>
            <div className={cls["message-inputbox"]}>
                <input type="text" />
                <button className={cls["sending-button"]}>SEND</button>
            </div>
        </div>
    ) 
}
