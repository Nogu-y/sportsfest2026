"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { api } from "../lib/api/client"; 

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

const LOCAL_STORAGE_KEYS = {
    UUID: "sportsfest_user_uuid",
    WATCHLIST: "sportsfest_local_watchlist",
    PUSH_ENABLED: "sportsfest_push_enabled",
};
const WATCHLIST_UPDATED_EVENT = "sportsfest:watchlist-updated";

export function useWatchlist() {
    const [uuid, setUuid] = useState<string | null>(null);
    const [localWatchlist, setLocalWatchlist] = useState<number[]>([]);
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
    const [isPushSupported, setIsPushSupported] = useState(false);

    const persistLocalWatchlist = (nextIds: number[]) => {
        setLocalWatchlist(nextIds);
        localStorage.setItem(LOCAL_STORAGE_KEYS.WATCHLIST, JSON.stringify(nextIds));
        window.dispatchEvent(new CustomEvent(WATCHLIST_UPDATED_EVENT, { detail: nextIds }));
    };

    // 1. 初期化: UUID生成, ローカルリスト, 通知設定の読み込み
    useEffect(() => {
        if (typeof window === "undefined") return;

        setIsPushSupported("serviceWorker" in navigator && "PushManager" in window);

        let currentUuid = localStorage.getItem(LOCAL_STORAGE_KEYS.UUID);
        if (!currentUuid) {
            currentUuid = crypto.randomUUID();
            localStorage.setItem(LOCAL_STORAGE_KEYS.UUID, currentUuid);
        }
        setUuid(currentUuid);

        const localData = localStorage.getItem(LOCAL_STORAGE_KEYS.WATCHLIST);
        if (localData) {
            setLocalWatchlist(JSON.parse(localData));
        }

        const pushEnabled = localStorage.getItem(LOCAL_STORAGE_KEYS.PUSH_ENABLED) === "true";
        setIsNotificationEnabled(pushEnabled);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const syncLocalWatchlist = () => {
            const localData = localStorage.getItem(LOCAL_STORAGE_KEYS.WATCHLIST);
            setLocalWatchlist(localData ? JSON.parse(localData) : []);
        };

        const onStorage = (event: StorageEvent) => {
            if (event.key === LOCAL_STORAGE_KEYS.WATCHLIST) {
                syncLocalWatchlist();
            }
        };

        const onWatchlistUpdated = () => {
            syncLocalWatchlist();
        };

        window.addEventListener("storage", onStorage);
        window.addEventListener(WATCHLIST_UPDATED_EVENT, onWatchlistUpdated);
        return () => {
            window.removeEventListener("storage", onStorage);
            window.removeEventListener(WATCHLIST_UPDATED_EVENT, onWatchlistUpdated);
        };
    }, []);

    // 2. リモートデータ同期 (SWR + Hono RPC)
    const { data: remoteConfig, mutate: mutateRemote } = useSWR(
        uuid && isNotificationEnabled ? `api/public/watchlist?uuid=${uuid}` : null,
        async () => {
            // ウォッチリストをGET
            const res = await api.api.public.watchlist.$get({ query: { uuid: uuid! } });
            if (!res.ok) return null;
            return res.json();
        },
        { revalidateOnFocus: false }
    );

    // 現在有効なウォッチリスト
    const watchedIds = isNotificationEnabled && remoteConfig
        ? remoteConfig.matchPlanIds
        : localWatchlist;

    // 3. ウォッチリストのトグル処理
    const toggleWatchlist = async (matchId: number) => {
        const isWatched = watchedIds.includes(matchId);
        const nextIds = isWatched
            ? watchedIds.filter((id) => id !== matchId)
            : [...watchedIds, matchId];

        if (isNotificationEnabled && uuid) {
            // 通知ON: サーバーと同期 (Hono RPC)
            try {
                await mutateRemote(
                    (current) => ({
                        uuid,
                        matchPlanIds: nextIds,
                    }),
                    { revalidate: false },
                );
                if (isWatched) {
                    await api.api.public.watchlist.$delete({
                        json: { uuid, matchPlanIds: [matchId] }
                    });
                } else {
                    await api.api.public.watchlist.$post({
                        json: { uuid, matchPlanIds: [matchId] }
                    });
                }
                await mutateRemote();
            } catch (err) {
                console.error("ウォッチリストのリモート更新に失敗しました", err);
                await mutateRemote();
            }
        } else {
            // 通知OFF: LocalStorageを更新
            persistLocalWatchlist(nextIds);
        }
    };

    // 4. プッシュ通知の有効化 (Web Push購読とサーバー登録)
    const enableNotification = async () => {
        if (!isPushSupported || !uuid) return false;
        if (!VAPID_PUBLIC_KEY) {
            console.error("環境変数 NEXT_PUBLIC_VAPID_PUBLIC_KEY が設定されていません。");
            return false;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: VAPID_PUBLIC_KEY,
                });
            }

            const subObj = subscription.toJSON();
            if (!subObj.endpoint || !subObj.keys?.p256dh || !subObj.keys?.auth) {
                throw new Error("サブスクリプションが不正です");
            }

            // Hono RPC: サブスクリプションのPOST
            await api.api.public.subscriptions.$post({
                json: {
                    uuid,
                    endpoint: subObj.endpoint,
                    expirationTime: subObj.expirationTime ?? null,
                    keys: {
                        p256dh: subObj.keys.p256dh,
                        auth: subObj.keys.auth,
                    },
                },
            });

            // Hono RPC: ローカルに保存していたウォッチリストを一気にサーバーへ登録同期
            if (localWatchlist.length > 0) {
                await api.api.public.watchlist.$post({
                    json: { uuid, matchPlanIds: localWatchlist },
                });
            }

            setIsNotificationEnabled(true);
            localStorage.setItem(LOCAL_STORAGE_KEYS.PUSH_ENABLED, "true");
            await mutateRemote();

            return true;
        } catch (err) {
            console.error("通知の有効化に失敗しました", err);
            return false;
        }
    };

    return {
        watchedIds,
        isNotificationEnabled,
        isPushSupported,
        isWatched: (matchId: number) => watchedIds.includes(matchId),
        toggleWatchlist,
        enableNotification,
    };
}
