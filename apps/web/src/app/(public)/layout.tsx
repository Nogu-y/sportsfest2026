import {ReactNode} from "react";
import Header from "../../components/layouts/header/Header";
import { PublicPageGate } from '../../components/auth/PublicPageGate'

export default function PublicLayout({children, modal}: { children: ReactNode, modal: ReactNode }) {
    return (
        <div className={"scrollbar-none"}>
            <PublicPageGate>
                <Header/>
                {children}
                {modal}
            </PublicPageGate>
        </div>
    )
}
