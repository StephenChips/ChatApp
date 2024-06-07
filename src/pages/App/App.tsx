import cls from "./App.module.css"
import { AccountInfo } from "./components/AccountInfo/AccountInfo"
import { SearchBox } from "./components/SearchBox/SearchBox"
import { ContactList } from "./components/ContactList/ContactList"
import { MessageWindow } from "./components/MessageWindow/MessageWindow"
import { useAppDispatch, useAppStore } from "../../store"
import { selectAllContacts } from "../../store/contacts"

export function App() {
  const dispatch = useAppDispatch()
  const store = useAppStore()
  const contacts = selectAllContacts(store.getState())

  console.log(store.getState())

  return (
    <div className={cls.app}>
      <div className={cls.sidebar}>
        <div className={cls["contact-title"]}>Contacts</div>
        <button className={cls["add-contact-btn"]}>+ Add Contact</button>
        <SearchBox />
        <ContactList contacts={contacts} className={cls["contact-list"]} />
        <AccountInfo />
      </div>

      <div className={cls["message-window-wrapper"]}>
        <MessageWindow />
      </div>
    </div>
  )
}
