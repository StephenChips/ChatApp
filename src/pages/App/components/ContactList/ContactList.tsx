import cls from "./ContactList.module.css"
import { Contact, User } from "../../../../store/modeltypes"
import { useContext } from "react"
import { MainPageContext } from "../../App"
import { useAppSelector } from "../../../../store"
import { selectAppUser } from "../../../../store/appUser"


export interface ContactListProps {
    contacts: Contact[],
    className?: string 
}

const MS_IN_A_MINUTE = 60000
const MS_IN_AN_HOUR = 60 * MS_IN_A_MINUTE

function lessThanAnHourFromNow(date: Date) {
    return Date.now() - date.getTime() < MS_IN_AN_HOUR
}

function lessThanAMinuteFromNow(date: Date) {
    return Date.now() - date.getTime() < MS_IN_A_MINUTE
}

function formatHour(date: Date) {
    return String(date.getHours() + 1).padStart(2, "0")
}

function formatMinute(date: Date) {
    return String(date.getMinutes() + 1).padStart(2, "0")
}

function minuteDiff(d1: Date, d2: Date): number {
    const timeDiff = d1.getTime() - d2.getTime()
    return Math.floor(timeDiff / MS_IN_A_MINUTE) 
}

function formatDateOfMonth(date: Date) {
    const dateOfMonth = date.getDate() + 1
    switch (dateOfMonth % 10) {
        case 1: return `${dateOfMonth}st`
        case 2: return `${dateOfMonth}nd`
        case 3: return `${dateOfMonth}rd`
        default: return `${dateOfMonth}th`
    }
}

function isInTheSameYear(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear()
}

function isInASameDate(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear()
        && d1.getMonth() === d2.getMonth()
        && d1.getDate() === d2.getDate()
}

function formatMonth(date: Date) {
    const month = date.getMonth() as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
    switch (month) {
        case 0: return "Jan"
        case 1: return "Feb"
        case 2: return "Mar"
        case 3: return "Apr"
        case 4: return "May"
        case 5: return "Jun"
        case 6: return "Jul"
        case 7: return "Aug"
        case 8: return "Sep"
        case 9: return "Oct"
        case 10: return "Nov"
        case 11: return "Dec"
    }
}

function formatYear(date: Date) {
    return String(date.getFullYear())
}

function ContactListItem({ contact }: { contact: Contact }) {
    const appUser = useAppSelector(selectAppUser) as User
    const { currentContact, setCurrentContact } = useContext(MainPageContext)
    const latestChat = contact.messages.length > 0 ? contact.messages[0] : undefined

    let shouldShowSenderName = false
    let latestChatText = "[No messages]"
    let latestChatTimeString = ""

    if (latestChat) {
        if (latestChat.senderID === appUser.id) {
            shouldShowSenderName = true
        }

        if (latestChat.type === "image") {
            latestChatText = "[image]"
        } else {
            latestChatText = latestChat.text.slice(0, 30)
        }

        const date = new Date(latestChat.sendTime)
        const now = new Date()
        
        if (lessThanAMinuteFromNow(date)) {
            latestChatTimeString = "Now"
        } else if (lessThanAnHourFromNow(date)) {
            latestChatTimeString = `${minuteDiff(now, date)} minute(s) ago`
        } else if (isInASameDate(date, now)) {
            latestChatTimeString = `${formatHour(date)}:${formatMinute(date)}`
        } else if (isInTheSameYear(date, now)) {
            latestChatTimeString = `${formatDateOfMonth(date)} ${formatMonth(date)}`
        } else {
            latestChatTimeString = `${formatDateOfMonth(date)} ${formatMonth(date)} ${formatYear(date)}`
        }
    }

    let classNames = cls["contact-list-item-wrapper"]
    if (currentContact?.user.id === contact.user.id) {
        classNames += " " + cls["selected"]
    }

    return (
        <div
            className={classNames}
            onClick={onClickListItem}
        >
            <img
                className={cls.avatar}
                src={contact.user.avatarURL}
            ></img>
            <div className={cls.rightContent}>
                <div className={cls.userName}>
                    {contact.user.name}
                </div>
                <div className={cls.latestChat}>
                    {
                        shouldShowSenderName
                            ? <span className={cls["sender-name"]}>You: </span>
                            : null
                    }
                    {latestChatText}
                </div>
                <div className={cls.latestChatTime}>
                    {latestChatTimeString}
                </div>
            </div>
        </div>
    )

    function onClickListItem() {
        if (contact.user.id === currentContact?.user.id) return
        setCurrentContact(contact.user.id)
    }
}

export function ContactList({ contacts, className = "" } : ContactListProps) {
    const contactListElements = contacts.map(contact => (
        <ContactListItem contact={contact} key={contact.user.id} />
    ))

    return (
        <div className={className + ` ${cls["contact-list-wrapper"]}`}>
            {contactListElements}
        </div>
    )
}
