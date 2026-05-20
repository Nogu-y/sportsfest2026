import type { MetadataRoute } from "next";

// Firefox でのパース失敗を防ぐため async を削除し、同期関数に変更
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "R8年度一関高専校内体育大会結果速報アプリ",
        // Firefox 等のホーム画面で文字化け・ブツ切りを防ぐため、視認性の高い6文字以内に調整
        short_name: "一関高専体育大会", 
        description: "令和8年度一関高専校内体育大会の結果速報をお届けするアプリです!",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        lang: "ja",
        // Firefox が確実に認識できるよう、purpose を1つに統合して最適化
        icons: [
            {
                src: "/web-app-manifest-192x192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any maskable"
            },
            {
                src: "/web-app-manifest-512x512.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable"
            }
        ],
        orientation: "portrait",
    };
}
