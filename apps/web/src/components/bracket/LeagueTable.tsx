"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSportsFestData } from "../../hooks/useSportsFestData";

export const LeagueTable = ({ block }: { block: any }) => {
    const { matches, teams } = useSportsFestData();

    const blockMatches = useMemo(() => matches.filter(m => m.eventBlockId === block.id), [matches, block.id]);

    // ランキングテーブルから参加チームを抽出し、現在の順位順で並べる
    const participatingTeams = useMemo(() => {
        if (!block.rankings) return [];
        return [...block.rankings].sort((a, b) => a.rank - b.rank);
    }, [block.rankings]);

    if (participatingTeams.length === 0) return <div className="text-gray-500">リーグ参加チームが未確定です。</div>;

    const getTeamName = (teamId: number) => teams.find(t => t.id === teamId)?.name || "未定";

    return (
        <div className="min-w-max border border-gray-300 bg-white">
            <table className="w-full border-collapse text-sm">
                <thead>
                <tr>
                    <th className="border border-gray-300 bg-gray-100 p-2 min-w-[80px]">順位</th>
                    <th className="border border-gray-300 bg-gray-100 p-2 min-w-[80px]">チーム</th>
                    {participatingTeams.map((pt) => (
                        <th key={`header-${pt.teamId}`} className="border border-gray-300 bg-gray-50 p-2 font-bold min-w-[60px]">
                            {getTeamName(pt.teamId)}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {participatingTeams.map((rowTeam) => (
                    <tr key={`row-${rowTeam.teamId}`}>
                        <td className="border border-gray-300 bg-gray-50 text-center font-bold">{rowTeam.rank}位</td>
                        <td className="border border-gray-300 bg-gray-50 p-2 font-bold whitespace-nowrap">
                            {getTeamName(rowTeam.teamId)}
                        </td>

                        {participatingTeams.map((colTeam) => {
                            // 自分自身
                            if (rowTeam.teamId === colTeam.teamId) {
                                return <td key={`diag-${colTeam.teamId}`} className="border border-gray-300 bg-gray-200" />;
                            }

                            const match = blockMatches.find(m =>
                                m.participants.some(p => p.teamId === rowTeam.teamId) &&
                                m.participants.some(p => p.teamId === colTeam.teamId)
                            );

                            if (!match) return <td key={`empty-${colTeam.teamId}`} className="border border-gray-300 text-center text-gray-300">-</td>;

                            const myScore = match.participants.find(p => p.teamId === rowTeam.teamId)?.score ?? "-";
                            const opScore = match.participants.find(p => p.teamId === colTeam.teamId)?.score ?? "-";

                            const isPlaying = match.status === "Playing";
                            const isWin = myScore !== "-" && opScore !== "-" && myScore > opScore;

                            return (
                                <td key={`match-${match.id}-${colTeam.teamId}`} className="border border-gray-300 p-0 text-center align-middle transition-colors hover:bg-gray-50">
                                    <Link href={`/match/${match.id}`} className={`block h-full w-full p-2 ${isPlaying ? 'bg-amber-100' : ''}`}>
                                        {match.status === "Finished" || match.status === "Completed" ? (
                                            <span className={`font-mono text-base ${isWin ? 'text-red-600 font-bold' : 'text-dark'}`}>
                                                    {myScore}-{opScore}
                                                </span>
                                        ) : (
                                            <span className="text-[10px] text-gray-500">{match.name || "詳細"}</span>
                                        )}
                                    </Link>
                                </td>
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};