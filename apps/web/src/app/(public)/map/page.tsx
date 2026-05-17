"use client"

import {useEffect} from "react";
import {InteractiveMap} from "../../../components/map/InteractiveMap";

// SSR（サーバーサイドレンダリング）を無効にして動的インポート

export default function Home() {

    useEffect(() => {
        // デフォルトのブラウザによる, 2連タップでのズームを抑制
        const touchHandler = (event: any) => {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        };

        if (!document) return;

        document.addEventListener('touchstart', touchHandler, {
            passive: false
        });
    }, [])


    return (
        <main className={"w-screen min-h-screen h-full flex flex-col items-center justify-center"}>
            <div className={"aspect-video h-auto w-full"}>

                <InteractiveMap/>
            </div>
        </main>
    );
}