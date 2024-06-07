import style from "./ContactList.module.css"
import { Contact, selectUserByContact } from "../../../../store/contacts"
import { useAppStore } from "../../../../store"

export interface ContactListProps {
    contacts: Contact[],
    className?: string 
}

export function ContactList({ contacts, className = "" } : ContactListProps) {
    const contactListElements = contacts.map(contact => (
        <ContactListItem contact={contact} key={contact.userID} />
    ))

    return (
        <div className={className + ` ${style["contact-list-wrapper"]}`}>
            {contactListElements}
        </div>
    )
}

function ContactListItem({ contact }: { contact: Contact }) {
    const store = useAppStore()
    const user = selectUserByContact(store.getState(), contact)

    return (
        <div
            className={style["contact-list-item-wrapper"]}
        >
            <img
                className={style.avatar}
                src={user.avatarURL}
            ></img>
            <div className={style.rightContent}>
                <div className={style.userName}>
                    {user.name}
                </div>
                <div className={style.latestChat}>
                    {contact.latestChat}
                </div>
                <div className={style.latestChatTime}>
                    {contact.latestChatTime}
                </div>
            </div>
        </div>
    )
}
