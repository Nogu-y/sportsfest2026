"use client";

import useSWR from "swr";

const LOCAL_STORAGE_TEAM_KEY = "sportsfest_user_team_id";

export function useMyTeam() {
    // SWRを使ってLocalStorageの値を読み取り、アプリ全体でキャッシュを共有する
    const { data: myTeamId, mutate } = useSWR<number | null>(
        LOCAL_STORAGE_TEAM_KEY,
        () => {
            if (typeof window === "undefined") return null;
            const stored = localStorage.getItem(LOCAL_STORAGE_TEAM_KEY);
            return stored ? parseInt(stored, 10) : null;
        },
        {
            fallbackData: null, // 初期値
            revalidateOnFocus: false, // ウィンドウフォーカス時の再検証は不要
        }
    );

    // チームを保存/解除する関数
    const saveMyTeam = async (teamId: number | null) => {
        if (teamId === null) {
            localStorage.removeItem(LOCAL_STORAGE_TEAM_KEY);
        } else {
            localStorage.setItem(LOCAL_STORAGE_TEAM_KEY, teamId.toString());
        }

        // ★ SWRのキャッシュを強制更新
        // これにより、useMyTeam() を呼び出している "すべてのコンポーネント" が即座に再描画されます
        await mutate(teamId);
    };

    return {
        myTeamId,
        saveMyTeam,
        isLoaded: myTeamId !== undefined,
    };
}