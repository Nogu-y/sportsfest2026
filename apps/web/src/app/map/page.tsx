"use client"

import dynamic from 'next/dynamic';

// SSR（サーバーサイドレンダリング）を無効にして動的インポート
const DynamicMap = dynamic(() => import('../../components/map/MapComponent'), {
    ssr: false,
    loading: () => <p>地図を読み込み中...</p>, // 読み込み中のプレースホルダー
});

export default function Home() {
    return (
        <main style={{ width: '100vw', height: '100vh' }}>
            <DynamicMap />
        </main>
    );
}