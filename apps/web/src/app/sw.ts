// app/sw.ts

import {
    Serwist,
    StaleWhileRevalidate,
    ExpirationPlugin,
    type RuntimeCaching,
    type PrecacheEntry,
    type SerwistGlobalConfig,
} from "serwist";
import { defaultCache } from "@serwist/next/worker";

declare global {
    interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
        // Change this attribute's name to your `injectionPoint`.
        // `injectionPoint` is an InjectManifest option.
        // See https://serwist.pages.dev/docs/build/configuring
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

// カスタムキャッシュ戦略
const cacheStrategies: RuntimeCaching[] = [
    {
        matcher: ({ request, url: { pathname }, sameOrigin }) =>
            request.headers.get("RSC") === "1" &&
            request.headers.get("Next-Router-Prefetch") === "1" &&
            sameOrigin &&
            !pathname.startsWith("/api/"),
        handler: new StaleWhileRevalidate({
            cacheName: "pages-rsc-prefetch",
            plugins: [
                new ExpirationPlugin({
                    maxEntries: 200,
                    maxAgeSeconds: 24 * 60 * 60, // 24時間
                    maxAgeFrom: "last-used",
                }),
            ],
        }),
    },
    {
        matcher: ({ request, url: { pathname }, sameOrigin }) =>
            request.headers.get("RSC") === "1" &&
            sameOrigin &&
            !pathname.startsWith("/api/"),
        handler: new StaleWhileRevalidate({
            cacheName: "pages-rsc",
            plugins: [
                new ExpirationPlugin({
                    maxEntries: 200,
                    maxAgeSeconds: 24 * 60 * 60, // 24時間
                    maxAgeFrom: "last-used",
                }),
            ],
        }),
    },
    {
        matcher: ({ request, url: { pathname }, sameOrigin }) =>
            (request.mode === "navigate" ||
                request.destination === "document" ||
                request.headers.get("Accept")?.includes("text/html")) &&
            sameOrigin &&
            !pathname.startsWith("/api/"),
        handler: new StaleWhileRevalidate({
            cacheName: "pages",
            plugins: [
                new ExpirationPlugin({
                    maxEntries: 200,
                    maxAgeSeconds: 24 * 60 * 60, // 24時間
                    maxAgeFrom: "last-used",
                }),
            ],
        }),
    },

    // その他のリソースのキャッシュ戦略
    // {
    //   matcher: /\.(?:mp4|webm)$/i,
    //   handler: new StaleWhileRevalidate({
    //     cacheName: 'static-video-assets',
    //     plugins: [
    //       new ExpirationPlugin({
    //         maxEntries: 32,
    //         maxAgeSeconds: 7 * 24 * 60 * 60,
    //         maxAgeFrom: 'last-used',
    //       }),
    //      new RangeRequestsPlugin(),
    //     ],
    //   }),
    // },
    
];

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [...cacheStrategies, ...defaultCache],

    // オプション
    // オフラインページを作成する場合はここを使用.
    // fallbacks: {  
    //     entries: [
    //         {
    //             url: "/offline",
    //             matcher({ request }) {
    //                 return request.destination === "document";
    //             },
    //         },
    //     ],
    // },
});

serwist.addEventListeners();

// app/sw.ts の末尾に追記

// ...既存のコード
serwist.addEventListeners();

// ==========================================
// Web Push 通知のハンドリング
// ==========================================

// 1. Push通知を受信したときの処理
self.addEventListener("push", (event) => {
    if (!event.data) return;

    try {
        // サーバーから送信されたJSONペイロードをパース
        const data = event.data.json();

        const title = data.title || "新しい通知";
        const options: NotificationOptions = {
            body: data.body || "メッセージが届きました",
            icon: data.icon || "https://dev.sho800.net/web-app-manifest-192x192.png", // ご自身の環境のアイコンパスに合わせてください
            badge: data.badge || "/icons/badge.png",      // 通知バー用モノクロアイコン
            data: data.url || "/",                        // クリック時の遷移先URLなどを保持
            tag: 'match-alert-' + Date.now(), // ← 毎回ユニークなタグをつける（上書き防止）
            renotify: true, // ← タグがあっても毎回音とバイブ（バナー）を強制する
        };

        // 通知を表示するまでService Workerを待機させる
        event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
        console.error("Pushイベントの処理に失敗しました:", error);

        // JSON形式でない単なるテキストが送られてきた場合のフォールバック
        event.waitUntil(
            self.registration.showNotification("新しい通知", {
                body: event.data.text(),
            })
        );
    }
});

// 2. 通知がクリックされたときの処理
self.addEventListener("notificationclick", (event) => {
    // クリックされたら通知を閉じる
    event.notification.close();

    // 通知生成時に仕込んでおいたURLを取得（なければルートを開く）
    const urlToOpen = new URL(event.notification.data || "/", self.location.origin).href;

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                // 既に該当するURLのタブが開いている場合は、そのタブにフォーカスを当てる
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url === urlToOpen && "focus" in client) {
                        return client.focus();
                    }
                }
                // まだ開いていない場合は、新しいタブ（ウィンドウ）でURLを開く
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            })
    );
});