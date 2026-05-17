import {ReactNode} from "react";
import Header from "../../components/layouts/header/Header";

export default function PublicLayout ({children, modal}: { children: ReactNode, modal: ReactNode }) {
    return (
        <div>
            <Header/>
            {children}
            {modal}
        </div>
    )
}