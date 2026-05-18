"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSportsFestData } from "../../hooks/useSportsFestData";
import { useMyTeam } from "../../hooks/useMyTeam"; // ★ 自クラスフックの導入
import type { PublicMasterResponse } from "../../../../api/src/schemas/public/master";

type PreviewData = {
    matches: PublicMasterResponse["matches"];
    teams: PublicMasterResponse["teams"];
    myTeamId?: number | null;
};

export const LeagueTable = ({ block, previewData }: { block: any; previewData?: PreviewData }) => {
    const sportsFestData = useSportsFestData();
    const { myTeamId } = useMyTeam(); // ★ グローバルな選択チームIDを直接取得
    const matches = previewData?.matches ?? sportsFestData.matches;
    const teams = previewData?.teams ?? sportsFestData.teams;
    const activeMyTeamId = previewData?.myTeamId ?? myTeamId;

    const blockMatches = useMemo(() => matches.filter((m: any) => m.eventBlockId === block.id), [matches, block.id]);

    const participatingTeams = useMemo(() => {
        if (!block.rankings) return [];
        return [...block.rankings].sort((a, b) => a.rank - b.rank);
    }, [block.rankings]);

    if (participatingTeams.length === 0) return <div className="text-gray-500">リーグ参加チームが未確定です。</div>;

    const getTeamName = (teamId: number) => teams.find((t: any) => t.id === teamId)?.name || "未定";

    return (
        <div className="min-w-max border border-gray-300 bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="w-full border-collapse text-sm">
                <thead>
                <tr>
                    <th className="border border-gray-300 bg-gray-100 p-2 min-w-[60px]">順位</th>
                    <th className="border border-gray-300 bg-gray-100 p-2 min-w-[100px]">チーム</th>
                    {participatingTeams.map((pt) => {
                        const isMyTeamCol = pt.teamId === activeMyTeamId;
                        return (
                            <th
                                key={`header-${pt.teamId}`}
                                className={`border border-gray-300 p-2 font-bold min-w-[70px] transition-colors ${
                                    isMyTeamCol ? "bg-amber-200 text-amber-950 font-black ring-2 ring-amber-400 ring-inset" : "bg-gray-50 text-gray-700"
                                }`}
                            >
                                {getTeamName(pt.teamId)}
                                {isMyTeamCol && <span className="block text-[8px] text-amber-700">My Class</span>}
                            </th>
                        );
                    })}
                </tr>
                </thead>
                <tbody>
                {participatingTeams.map((rowTeam) => {
                    const isMyTeamRow = rowTeam.teamId === activeMyTeamId;

                    return (
                        <tr
                            key={`row-${rowTeam.teamId}`}
                            className={`transition-colors ${isMyTeamRow ? "bg-amber-50/50" : ""}`}
                        >
                            {/* 順位セル */}
                            <td className={`border border-gray-300 text-center font-bold ${isMyTeamRow ? "bg-amber-100/70 text-amber-950" : "bg-gray-50"}`}>
                                {rowTeam.rank}位
                            </td>

                            {/* チーム名ヘッダー */}
                            <td className={`border border-gray-300 p-2 font-bold whitespace-nowrap transition-colors ${
                                isMyTeamRow ? "bg-amber-100 text-amber-950 font-black border-r-amber-300" : "bg-gray-50"
                            }`}>
                                {getTeamName(rowTeam.teamId)}
                                {isMyTeamRow && <span className="inline-block ml-1 text-[9px] bg-amber-500 text-white px-1 rounded">自分</span>}
                            </td>

                            {/* 各対戦セル（N x N） */}
                            {participatingTeams.map((colTeam) => {
                                const isMyTeamCol = colTeam.teamId === activeMyTeamId;

                                // 自分自身との交点（対角線）
                                if (rowTeam.teamId === colTeam.teamId) {
                                    return <td key={`diag-${colTeam.teamId}`} className="border border-gray-300 bg-gray-100" />;
                                }

                                const match = blockMatches.find((m: any) =>
                                    m.participants.some((p: any) => p.teamId === rowTeam.teamId) &&
                                    m.participants.some((p: any) => p.teamId === colTeam.teamId)
                                );

                                // 試合がまだ組まれていない
                                if (!match) return <td key={`empty-${colTeam.teamId}`} className="border border-gray-300 text-center text-gray-300">-</td>;

                                const myScore = match.participants.find((p: any) => p.teamId === rowTeam.teamId)?.score ?? "-";
                                const opScore = match.participants.find((p: any) => p.teamId === colTeam.teamId)?.score ?? "-";

                                const isPlaying = match.status === "Playing";
                                const isWin = myScore !== "-" && opScore !== "-" && myScore > opScore;

                                // 自クラスがこのセル（試合）に関与しているかどうかの背景色ブレンド
                                let cellBgClass = "hover:bg-gray-50/80";
                                if (isPlaying) {
                                    cellBgClass = "bg-green-50 animate-pulse";
                                } else if (isMyTeamRow || isMyTeamCol) {
                                    cellBgClass = "bg-amber-50/40 hover:bg-amber-100/50";
                                }

                                return (
                                    <td
                                        key={`match-${match.id}-${colTeam.teamId}`}
                                        className={`border border-gray-300 p-0 text-center align-middle transition-all ${cellBgClass}`}
                                    >
                                        <Link href={`/match/${match.id}`} className="block h-full w-full p-2">
                                            {match.status === "Finished" || match.status === "Completed" ? (
                                                <span className={`font-mono text-base tracking-wider ${
                                                    isWin ? 'text-red-600 font-bold drop-shadow-sm' : isMyTeamRow && !isWin && myScore !== "-" ? 'text-blue-600' : 'text-dark'
                                                }`}>
                                                        {myScore}-{opScore}
                                                    </span>
                                            ) : (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${isPlaying ? 'bg-green-500 text-white font-bold' : 'text-gray-500 bg-gray-100'}`}>
                                                        {match.name || "詳細"}
                                                    </span>
                                            )}
                                        </Link>
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};
