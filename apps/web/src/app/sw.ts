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
            request.headers.get("Content-Type")?.includes("text/html") &&
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