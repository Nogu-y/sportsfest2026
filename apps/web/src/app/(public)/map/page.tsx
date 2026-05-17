"use client"

import dynamic from 'next/dynamic';
import {useEffect} from "react";

// SSR（サーバーサイドレンダリング）を無効にして動的インポート
const DynamicMap = dynamic(() => import('../../../components/map/MapComponent'), {
    ssr: false,
    loading: () => <p>地図を読み込み中...</p>, // 読み込み中のプレースホルダー
});

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
                
                <DynamicMap/>
            </div>
        </main>
    );
}