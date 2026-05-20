import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "R8年度一関高専校内体育大会結果速報アプリ",
    short_name: "一関高専体育大会",
    description: "令和8年度一関高専校内体育大会の結果速報をお届けするアプリです!",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "ja",
    // TypeScriptの型を満たしつつ、Firefoxにも対応させる配列表現
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    orientation: "portrait",
  };
}
