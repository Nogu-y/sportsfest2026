"use client";

import { useEffect, useState } from "react";
import { useWatchlist } from "../../hooks/useWatchlist";

export const PwaNotificationPrompt = () => {
    const { isNotificationEnabled, isPushSupported, enableNotification } = useWatchlist();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // 1. すでにPWA（Standaloneモード）として起動しているかチェック
        const checkStandalone = window.matchMedia("(display-mode: standalone)").matches
            || (window.navigator as any).standalone === true;
        setIsStandalone(checkStandalone);

        // 2. ブラウザのPWAインストールプロンプトイベントを捕捉
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }, []);

    // PWAインストール処理の実行
    const handleInstallPwa = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setDeferredPrompt(null);
        }
    };

    // すでにホーム画面追加＆通知もONなら何も表示しない
    if (isStandalone && isNotificationEnabled) return null;

    return (
        <div className="w-full space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-dark">
            <h3 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                通知設定
            </h3>
            <p className="text-xs leading-relaxed text-blue-800">
                ウォッチリストに入れた試合の開始時間が近づくと通知が届きます。
            </p>

            <div className="flex flex-col gap-2 pt-1">
                {/* パターンA: まだホーム画面に追加（PWA化）していない場合 */}
                {!isStandalone && deferredPrompt && (
                    <button
                        onClick={handleInstallPwa}
                        className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-95 shadow-sm"
                    >
                        アプリをホーム画面に追加する（推奨）
                    </button>
                )}

                {/* パターンB: ホーム画面化はしているが、通知がまだOFFの場合 */}
                {isPushSupported && !isNotificationEnabled && (
                    <button
                        onClick={async () => {
                            const success = await enableNotification();
                            if (success) alert("試合状況のプッシュ通知を有効にしました！");
                        }}
                        className="w-full rounded-lg bg-dark py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-95"
                    >
                        試合速報のプッシュ通知をオンにする
                    </button>
                )}
            </div>
        </div>
    );
};