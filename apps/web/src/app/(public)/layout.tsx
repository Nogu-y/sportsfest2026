import {ReactElement} from "react";
import Header from "../../components/layouts/header/Header";

export default function PublicLayout ({children}: { children: ReactElement }) {
    return (
        <div>
            <Header/>
            {children}
        </div>
    )
}