"use client";

import { useState, useMemo } from "react";
import { useSportsFestData } from "./useSportsFestData";
import { api } from "../lib/api/client";

export type MatchStatus = "開始待機中" | "試合中" | "終了" | "確定済み" | "中止";
export type ApiMatchStatus = "Waiting" | "Preparing" | "Playing" | "Finished" | "Completed" | "Cancelled";

export type StaffMatch = {
    id: number;
    eventBlockId: number;
    facilityId: number;
    sport: string;
    format: string; // スコア制/タイム制の判定用
    name: string; // 試合名（例: 決勝、予選A-1）
    status: MatchStatus;
    rawStatus: ApiMatchStatus;
    teams: { id: number | null; name: string }[];
    scheduledStartTime: string;
    scheduledEndTime: string;
    startedAt: string | null;
};

const apiToStatus = (apiStatus: ApiMatchStatus): MatchStatus => {
    if (apiStatus === "Playing") return "試合中";
    if (apiStatus === "Finished") return "終了";
    if (apiStatus === "Completed") return "確定済み";
    if (apiStatus === "Cancelled") return "中止";
    if (apiStatus === "Preparing") return "開始待機中"; // UI上のPreparingは「開始待機中」
    return "開始待機中"; // Waiting
};

export function useStaffMatches() {
    const {
        locations,
        events,
        matches: integratedMatches,
        refreshMaster,
        isLoading,
    } = useSportsFestData();

    // ★ 初期状態を空配列（会場が何も選択されていない状態）にする
    const [activeFacilityIds, setActiveFacilityIds] = useState<number[]>([]);
    // 終了した試合（Completed / Cancelled）を表示するかどうかのステータス
    const [showCompleted, setShowCompleted] = useState<boolean>(false);

    // 会場のトグル関数
    const toggleFacilityId = (id: number) => {
        setActiveFacilityIds((prev) =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const eventsMap = useMemo(() => new Map(events?.map(e => [e.id, e])), [events]);

    // 全試合データを統合・ソート (上から開始時間順)
    const allMatches: StaffMatch[] = useMemo(() => {
        if (!integratedMatches || integratedMatches.length === 0) return [];

        return [...integratedMatches]
            .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())
            .map((m) => {
                const eventObj = eventsMap.get(m.eventId);
                const sportName = eventObj?.name || "競技";
                const formatType = eventObj?.format || "TOURNAMENT";

                const teamsArray = m.participants?.map((p: any) => ({
                    id: p.teamId,
                    name: p.teamId ? (m as any)._teamsMap?.get(p.teamId)?.name || `チーム #${p.teamId}` : "未定"
                })) || [];

                return {
                    id: m.id,
                    eventBlockId: m.eventBlockId,
                    facilityId: m.locationId || 0,
                    sport: sportName,
                    format: formatType,
                    name: m.name || "",
                    status: apiToStatus(m.status as ApiMatchStatus),
                    rawStatus: m.status as ApiMatchStatus,
                    teams: teamsArray,
                    scheduledStartTime: m.scheduledStartTime,
                    scheduledEndTime: m.scheduledEndTime,
                    startedAt: m.startedAt,
                };
            });
    }, [integratedMatches, eventsMap]);

    // 施設ごとにグループ化、かつステータスフィルターを適用
    const matchesByFacility = useMemo(() => {
        const grouped = new Map<number, StaffMatch[]>();

        allMatches.forEach(m => {
            // 終了した試合を表示しない設定の場合、Completed と Cancelled を省く
            if (!showCompleted && (m.rawStatus === "Completed" || m.rawStatus === "Cancelled")) {
                return;
            }

            const list = grouped.get(m.facilityId) || [];
            list.push(m);
            grouped.set(m.facilityId, list);
        });
        return grouped;
    }, [allMatches, showCompleted]);

    // ステータス更新RPCリクエスト
    const updateStatus = async (matchId: number, nextApiStatus: ApiMatchStatus) => {
        try {
            const res = await api.api.staff.matches[":matchId"].status.$patch({
                param: { matchId },
                json: { status: nextApiStatus },
            });
            if (!res.ok) throw new Error("ステータスの更新に失敗しました");
            refreshMaster();
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "エラーが発生しました");
        }
    };

    // 試合結果（スコア・タイム）の確定送信
    const finalizeMatchResult = async (matchId: number, payload: { winnerTeamId: number | null; scores: Record<number, any> }) => {
        try {
            // スコア確定用エンドポイントへの送信ロジック（スキーマや拡張に合わせて最適化してください）
            // ここでは仕様通り status を "Completed" にアップデートしつつ結果を送信する想定
            const res = await api.api.staff.matches[":matchId"].status.$patch({
                param: { matchId },
                json: { status: "Completed" },
            });
            if (!res.ok) throw new Error("結果の確定に失敗しました");

            alert(`試合 #${matchId} の結果を確定しました。`);
            refreshMaster();
        } catch (err) {
            console.error(err);
            alert("結果確定通信でエラーが発生しました");
        }
    };

    return {
        facilities: locations || [],
        activeFacilityIds,
        toggleFacilityId,
        showCompleted,
        setShowCompleted,
        matchesByFacility,
        updateStatus,
        finalizeMatchResult,
        isLoading,
    };
}