import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

import style from "./SearchBox.module.css"

export function SearchBox() {
    return (
        <div className={style["search-box-wrapper"]}>
            <input
                type="text"
                className={style["search-box"]}
                placeholder="Search user..."
             />
             <FontAwesomeIcon
                className={style["search-icon"]}
                icon={faMagnifyingGlass}
            />
        </div>
    )
    return 
}