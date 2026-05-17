import {ReactNode} from "react";
import Header from "../../components/layouts/header/Header";

export default function PublicLayout ({children, modal}: { children: ReactNode, modal: ReactNode }) {
    return (
        <div className={"scrollbar-none"}>
            <Header/>
            {children}
            {modal}
        </div>
    )
}