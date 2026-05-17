"use client"

import dynamic from 'next/dynamic';

// SSR（サーバーサイドレンダリング）を無効にして動的インポート
const DynamicMap = dynamic(() => import('../../../components/map/MapComponent'), {
    ssr: false,
    loading: () => <p>地図を読み込み中...</p>, // 読み込み中のプレースホルダー
});

export default function Home() {

    // デフォルトのブラウザによる, 2連タップでのズームを抑制
    const touchHandler = (event: any) => {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    };
    document.addEventListener('touchstart', touchHandler, {
        passive: false
    });


    return (
        <main style={{ width: '100vw', height: '100vh' }}>
            <DynamicMap />
        </main>
    );
}