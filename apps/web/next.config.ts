import type {NextConfig} from 'next'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import withSerwistInit from "@serwist/next";
import {execSync} from "child_process";

//git commit hashをキャッシュバージョンとして使用
const revision = execSync("git rev-parse HEAD", {
    encoding: "utf-8"
})
    .trim()
    .slice(0, 7);

const withSerwist = withSerwistInit({
    cacheOnNavigation: true,
    reloadOnOnline: false,
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    // disable: process.env.NODE_ENV === "development",
    disable: false,
    additionalPrecacheEntries: [  // ここでキャッシュ保持しておくページを指定.
        {url: "/", revision},
        {url: "/map", revision}
    ]
});

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.join(currentDir, '../..')

const nextConfig: NextConfig = {
    transpilePackages: ['@sportsfest/shared'],
    turbopack: {
        root: workspaceRoot
    }
}

export default withSerwist(nextConfig);
