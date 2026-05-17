"use client";

import { useState, useEffect, useCallback } from "react";
import {api} from "../lib/api/client"

interface UseWatchlistProps {
    uuid: string | null;
    hasActiveSubscription: boolean;
}

export const useWatchlist = ({ uuid, hasActiveSubscription }: UseWatchlistProps) => {
    const [watchlist, setWatchlist] = useState<number[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // ローカルステートとLocalStorageの同期を隠蔽するユーティリティ
    const updateLocal = useCallback((newList: number[]) => {
        // 重複を排除して昇順ソート（バックエンドの deduplicateMatchPlanIds と同じ振る舞い）
        const sortedUniqueList = Array.from(new Set(newList)).sort((a, b) => a - b);
        setWatchlist(sortedUniqueList);
        try {
            localStorage.setItem("watchlist", JSON.stringify(sortedUniqueList));
        } catch (error) {
            console.error("LocalStorage save failed:", error);
        }
    }, []);

    // 初回マウント時にLocalStorageから読み込み
    useEffect(() => {
        try {
            const stored = localStorage.getItem("watchlist");
            if (stored) {
                updateLocal(JSON.parse(stored));
            }
        } catch (error) {
            console.error("LocalStorage load failed:", error);
        } finally {
            setIsLoaded(true);
        }
    }, [updateLocal]);

    // ウォッチリストへの追加
    const addWatchlist = useCallback(async (matchPlanId: number) => {
        if (watchlist.includes(matchPlanId)) return;

        // optimistic UI更新(即座に画面へ反映)
        const prevList = [...watchlist];
        updateLocal([...prevList, matchPlanId]);

        // 2. 通知が有効な場合はリモートへ同期
        if (hasActiveSubscription && uuid) {
            try {
                // バックエンドに合わせて配列で送信
                const res = await api.api.public.watchlist.post({
                    uuid,
                    matchPlanIds: [matchPlanId]
                });

                // Hono RPCから返却された最新のリストでローカルを上書きし、完全な整合性を担保
                if (res.matchPlanIds) {
                    updateLocal(res.matchPlanIds);
                }
            } catch (error) {
                console.error("リモート同期エラー:", error);
                // エラー時はローカルのUI状態をロールバック
                updateLocal(prevList);
            }
        }
    }, [watchlist, updateLocal, hasActiveSubscription, uuid]);

    // ウォッチリストからの削除
    const removeWatchlist = useCallback(async (matchPlanId: number) => {
        if (!watchlist.includes(matchPlanId)) return;

        // 1. オプティミスティックUI更新
        const prevList = [...watchlist];
        updateLocal(prevList.filter((id) => id !== matchPlanId));

        // 2. 通知が有効な場合はリモートからも削除
        if (hasActiveSubscription && uuid) {
            try {
                // DELETEメソッドを想定（エンドポイントの実装に合わせて適宜 .delete() に変更してください）
                const res = await api.api.public.watchlist.delete({
                    uuid,
                    matchPlanIds: [matchPlanId]
                });

                if (res.matchPlanIds) {
                    updateLocal(res.matchPlanIds);
                }
            } catch (error) {
                console.error("リモート削除エラー:", error);
                // エラー時はロールバック
                updateLocal(prevList);
            }
        }
    }, [watchlist, updateLocal, hasActiveSubscription, uuid]);

    // 通知を初めてONにした際などに呼ばれる一括同期
    const syncRemoteWatchlist = useCallback(async () => {
        if (hasActiveSubscription && uuid && watchlist.length > 0) {
            try {
                const res = await api.api.public.watchlist.post({
                    uuid,
                    matchPlanIds: watchlist
                });

                if (res.matchPlanIds) {
                    updateLocal(res.matchPlanIds);
                }
            } catch (error) {
                console.error("一括同期エラー:", error);
            }
        }
    }, [watchlist, updateLocal, hasActiveSubscription, uuid]);

    // 特定の試合がウォッチリストに入っているか
    const isWatched = useCallback((matchPlanId: number) => {
        return watchlist.includes(matchPlanId);
    }, [watchlist]);

    return {
        watchlist,
        isLoaded,
        addWatchlist,
        removeWatchlist,
        syncRemoteWatchlist,
        isWatched,
    };
};