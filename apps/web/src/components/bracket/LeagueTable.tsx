"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSportsFestData } from "../../hooks/useSportsFestData";
import { useMyTeam } from "../../hooks/useMyTeam";
import type { PublicMasterResponse } from "../../../../api/src/schemas/public/master";

type PreviewData = {
    matches: PublicMasterResponse["matches"];
    teams: PublicMasterResponse["teams"];
    myTeamId?: number | null;
};

export const LeagueTable = ({ block, previewData }: { block: any; previewData?: PreviewData }) => {
    const sportsFestData = useSportsFestData();
    const { myTeamId } = useMyTeam();
    const matches = previewData?.matches ?? sportsFestData.matches;
    const teams = previewData?.teams ?? sportsFestData.teams;
    const activeMyTeamId = previewData?.myTeamId ?? myTeamId;

    const blockMatches = useMemo(
        () => matches.filter((m: any) => m.eventBlockId === block.id),
        [matches, block.id],
    );

    const hasFinalRankings = useMemo(
        () => Array.isArray(block.rankings) && block.rankings.length > 0,
        [block.rankings],
    );

    const rankingMap = useMemo(() => {
        if (!hasFinalRankings) return new Map<number, number>();
        return new Map<number, number>(
            block.rankings.map((ranking: any) => [ranking.teamId, ranking.rank]),
        );
    }, [block.rankings, hasFinalRankings]);

    const participatingTeams = useMemo(() => {
        if (hasFinalRankings) {
            return [...block.rankings].sort((a: any, b: any) => a.rank - b.rank);
        }

        const teamIds = new Set<number>();
        for (const match of blockMatches) {
            for (const participant of match.participants ?? []) {
                if (participant.teamId) {
                    teamIds.add(participant.teamId);
                }
            }
        }

        return Array.from(teamIds)
            .sort((a, b) => a - b)
            .map((teamId) => ({ teamId }));
    }, [block.rankings, blockMatches, hasFinalRankings]);

    if (participatingTeams.length === 0) {
        return <div className="text-gray-500">リーグ参加チームが未確定です。</div>;
    }

    const getTeamName = (teamId: number) => teams.find((t: any) => t.id === teamId)?.name || "未定";

    return (
        <div className="min-w-max overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr>
                        {hasFinalRankings && (
                            <th className="min-w-[60px] border border-gray-300 bg-gray-100 p-2">順位</th>
                        )}
                        <th className="min-w-[100px] border border-gray-300 bg-gray-100 p-2">チーム</th>
                        {participatingTeams.map((pt) => {
                            const isMyTeamCol = pt.teamId === activeMyTeamId;
                            return (
                                <th
                                    key={`header-${pt.teamId}`}
                                    className={`min-w-[70px] border border-gray-300 p-2 font-bold transition-colors ${
                                        isMyTeamCol
                                            ? "bg-amber-200 font-black text-amber-950 ring-2 ring-amber-400 ring-inset"
                                            : "bg-gray-50 text-gray-700"
                                    }`}
                                >
                                    {getTeamName(pt.teamId)}
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
                                {hasFinalRankings && (
                                    <td
                                        className={`border border-gray-300 text-center font-bold ${
                                            isMyTeamRow ? "bg-amber-100/70 text-amber-950" : "bg-gray-50"
                                        }`}
                                    >
                                        {rankingMap.get(rowTeam.teamId) ?? "-"}位
                                    </td>
                                )}

                                <td
                                    className={`whitespace-nowrap border border-gray-300 p-2 text-center font-bold transition-colors ${
                                        isMyTeamRow
                                            ? "border-r-amber-300 bg-amber-100 font-black text-amber-950"
                                            : "bg-gray-50"
                                    }`}
                                >
                                    {getTeamName(rowTeam.teamId)}
                                </td>

                                {participatingTeams.map((colTeam) => {
                                    const isMyTeamCol = colTeam.teamId === activeMyTeamId;

                                    if (rowTeam.teamId === colTeam.teamId) {
                                        return (
                                            <td
                                                key={`diag-${colTeam.teamId}`}
                                                className="border border-gray-300 bg-gray-100"
                                            />
                                        );
                                    }

                                    const match = blockMatches.find(
                                        (m: any) =>
                                            m.participants.some((p: any) => p.teamId === rowTeam.teamId) &&
                                            m.participants.some((p: any) => p.teamId === colTeam.teamId),
                                    );

                                    if (!match) {
                                        return (
                                            <td
                                                key={`empty-${colTeam.teamId}`}
                                                className="border border-gray-300 text-center text-gray-300"
                                            >
                                                -
                                            </td>
                                        );
                                    }

                                    const myScore =
                                        match.participants.find((p: any) => p.teamId === rowTeam.teamId)?.score ?? "-";
                                    const opScore =
                                        match.participants.find((p: any) => p.teamId === colTeam.teamId)?.score ?? "-";

                                    const isPlaying = match.status === "Playing";
                                    const isWin = myScore !== "-" && opScore !== "-" && myScore > opScore;

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
                                            <Link href={`/match/${match.id}`} scroll={false} className="block h-full w-full p-2">
                                                {match.status === "Finished" || match.status === "Completed" ? (
                                                    <span
                                                        className={`font-mono text-base tracking-wider ${
                                                            isWin
                                                                ? "font-bold text-red-600 drop-shadow-sm"
                                                                : isMyTeamRow && !isWin && myScore !== "-"
                                                                  ? "text-blue-600"
                                                                  : "text-dark"
                                                        }`}
                                                    >
                                                        {myScore}-{opScore}
                                                    </span>
                                                ) : (
                                                    <span
                                                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                                                            isPlaying
                                                                ? "bg-green-500 font-bold text-white"
                                                                : "bg-gray-100 text-gray-500"
                                                        }`}
                                                    >
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
