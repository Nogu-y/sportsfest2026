import {ReactNode} from "react";
import Header from "../../components/layouts/header/Header";
import {ComingSoon} from "../../components/layouts/messagePage/ComingSoon";

export default function PublicLayout ({children, modal}: { children: ReactNode, modal: ReactNode }) {
    return (
        <div className={"scrollbar-none"}>
            <ComingSoon />
            {/*<Header/>*/}
            {/*{children}*/}
            {/*{modal}*/}
        </div>
    )
}