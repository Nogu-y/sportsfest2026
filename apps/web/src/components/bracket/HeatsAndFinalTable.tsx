"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSportsFestData } from "../../hooks/useSportsFestData";
import { useMyTeam } from "../../hooks/useMyTeam";
import type { PublicMasterResponse } from "../../../../api/src/schemas/public/master";

const HEAT_CARD_W = 240;
const FINAL_CARD_W = 260;
const COL_GAP = 160;
const CARD_GAP_Y = 18;
const HEAT_HEADER_H = 28;
const HEAT_ROW_H = 28;
const FINAL_HEADER_H = 28;
const FINAL_ROW_H = 30;
const CARD_PADDING_Y = 10;
const OUTER_PADDING = 16;

type PreviewData = {
    matches: PublicMasterResponse["matches"];
    teams: PublicMasterResponse["teams"];
    eventBlocks?: PublicMasterResponse["blocks"];
    myTeamId?: number | null;
};

type HeatRow = {
    id: number;
    teamId: number | null;
    label: string;
    score: number | null;
    rank: number | null;
};

type HeatCard = {
    block: PublicMasterResponse["blocks"][number];
    match: PublicMasterResponse["matches"][number] | null;
    rows: HeatRow[];
    winnerTeamId: number | null;
    winnerRowIndex: number;
};

type FinalRow = {
    id: number;
    teamId: number | null;
    sourceBlockId: number | null;
    label: string;
    score: number | null;
    rank: number | null;
};

type HeatLayout = {
    card: HeatCard;
    x: number;
    y: number;
    width: number;
    height: number;
    winnerY: number;
};

function sortMatchesByTime(left: PublicMasterResponse["matches"][number], right: PublicMasterResponse["matches"][number]) {
    const t = new Date(left.scheduledStartTime).getTime() - new Date(right.scheduledStartTime).getTime();
    if (t !== 0) return t;
    return left.id - right.id;
}

export const HeatsAndFinalTable = ({
    eventId,
    blocks,
    previewData,
}: {
    eventId: number;
    blocks: PublicMasterResponse["blocks"];
    previewData?: PreviewData;
}) => {
    const sportsFestData = useSportsFestData();
    const { myTeamId } = useMyTeam();
    const matches = previewData?.matches ?? sportsFestData.matches;
    const teams = previewData?.teams ?? sportsFestData.teams;
    const eventBlocks = previewData?.eventBlocks ?? sportsFestData.eventBlocks ?? blocks;
    const activeMyTeamId = previewData?.myTeamId ?? myTeamId;

    const blockById = useMemo(() => new Map(eventBlocks.map((block) => [block.id, block])), [eventBlocks]);
    const eventBlockIds = useMemo(() => new Set(blocks.map((block) => block.id)), [blocks]);

    const eventMatches = useMemo(
        () => matches.filter((match) => eventBlockIds.has(match.eventBlockId)).sort(sortMatchesByTime),
        [matches, eventBlockIds],
    );

    const getTeamName = (teamId: number | null) => {
        if (!teamId) return "未定";
        return teams.find((team) => team.id === teamId)?.name ?? "未定";
    };

    const finalMatch = useMemo(() => {
        const matchWithPrereqBlocks = eventMatches.find((match) =>
            (match.participants ?? []).some((participant) => participant.prereqBlockId !== null),
        );
        if (matchWithPrereqBlocks) return matchWithPrereqBlocks;

        const stagedFinal = eventMatches.find((match) => match.stage === "FINAL");
        if (stagedFinal) return stagedFinal;

        return eventMatches[0] ?? null;
    }, [eventMatches]);

    const sourceBlockIds = useMemo(() => {
        if (!finalMatch) return [] as number[];
        const ids = finalMatch.participants
            .map((participant) => participant.prereqBlockId)
            .filter((value): value is number => value !== null);
        return Array.from(new Set(ids));
    }, [finalMatch]);

    const heatCards = useMemo<HeatCard[]>(() => {
        let heatBlocks: PublicMasterResponse["blocks"] = [];

        if (sourceBlockIds.length > 0) {
            heatBlocks = sourceBlockIds
                .map((id) => blockById.get(id))
                .filter((block): block is PublicMasterResponse["blocks"][number] => Boolean(block));
        } else {
            const finalBlockId = finalMatch?.eventBlockId ?? null;
            heatBlocks = blocks.filter((block) => block.type === "SINGLE" && block.id !== finalBlockId);
        }

        return heatBlocks.map((block) => {
            const blockMatches = eventMatches
                .filter((match) => match.eventBlockId === block.id)
                .sort(sortMatchesByTime);
            const baseMatch = blockMatches[0] ?? null;
            const participants = baseMatch?.participants ?? [];

            const participantRows: HeatRow[] = participants
                .map((participant) => ({
                    id: participant.id,
                    teamId: participant.teamId,
                    label: getTeamName(participant.teamId),
                    score: participant.score,
                    rank: participant.rank,
                }))
                .sort((left, right) => {
                    if (left.rank !== null && right.rank !== null) return left.rank - right.rank;
                    if (left.rank !== null) return -1;
                    if (right.rank !== null) return 1;
                    return left.id - right.id;
                });

            const rankingRows: HeatRow[] = block.rankings
                .map((ranking, index) => ({
                    id: Number(`9${block.id}${index + 1}`),
                    teamId: ranking.teamId,
                    label: getTeamName(ranking.teamId),
                    score: ranking.points ?? null,
                    rank: ranking.rank,
                }))
                .sort((left, right) => (left.rank ?? 999) - (right.rank ?? 999));

            const rows = participantRows.length > 0 ? participantRows : rankingRows;

            const winnerFromRows = rows.find((row) => row.rank === 1 && row.teamId !== null)?.teamId ?? null;
            const winnerFromBlockRanking = block.rankings.find((ranking) => ranking.rank === 1)?.teamId ?? null;
            const winnerTeamId = winnerFromRows ?? winnerFromBlockRanking ?? null;

            const winnerRowIndex = rows.findIndex((row) => row.teamId !== null && row.teamId === winnerTeamId);

            return {
                block,
                match: baseMatch,
                rows,
                winnerTeamId,
                winnerRowIndex: winnerRowIndex >= 0 ? winnerRowIndex : 0,
            };
        });
    }, [blockById, blocks, eventMatches, finalMatch, sourceBlockIds, teams]);

    const sourceOrderMap = useMemo(() => {
        const map = new Map<number, number>();
        heatCards.forEach((card, index) => map.set(card.block.id, index));
        return map;
    }, [heatCards]);

    const finalRows = useMemo<FinalRow[]>(() => {
        if (!finalMatch) return [];

        return finalMatch.participants
            .map((participant) => {
                const sourceBlock = participant.prereqBlockId ? blockById.get(participant.prereqBlockId) : undefined;

                let label = "未定";
                if (participant.teamId) {
                    label = getTeamName(participant.teamId);
                } else if (sourceBlock) {
                    if (participant.prereqRank === null || participant.prereqRank === 1) {
                        label = `${sourceBlock.name}の勝者`;
                    } else {
                        label = `${sourceBlock.name} ${participant.prereqRank}位`;
                    }
                } else if (participant.prereqMatchId) {
                    label = `試合${participant.prereqMatchId}の勝者`;
                }

                return {
                    id: participant.id,
                    teamId: participant.teamId,
                    sourceBlockId: participant.prereqBlockId,
                    label,
                    score: participant.score,
                    rank: participant.rank,
                };
            })
            .sort((left, right) => {
                const leftOrder = left.sourceBlockId ? (sourceOrderMap.get(left.sourceBlockId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
                const rightOrder = right.sourceBlockId ? (sourceOrderMap.get(right.sourceBlockId) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
                if (leftOrder !== rightOrder) return leftOrder - rightOrder;
                return left.id - right.id;
            });
    }, [blockById, finalMatch, sourceOrderMap, teams]);

    const heatLayouts = useMemo<HeatLayout[]>(() => {
        let y = 0;
        return heatCards.map((card) => {
            const rowCount = Math.max(card.rows.length, 1);
            const cardH = HEAT_HEADER_H + CARD_PADDING_Y * 2 + rowCount * HEAT_ROW_H;
            const winnerY = y + HEAT_HEADER_H + CARD_PADDING_Y + card.winnerRowIndex * HEAT_ROW_H + HEAT_ROW_H / 2;

            const layout: HeatLayout = {
                card,
                x: 0,
                y,
                width: HEAT_CARD_W,
                height: cardH,
                winnerY,
            };

            y += cardH + CARD_GAP_Y;
            return layout;
        });
    }, [heatCards]);

    const totalHeatHeight = useMemo(() => {
        if (heatLayouts.length === 0) return 0;
        const last = heatLayouts[heatLayouts.length - 1];
        return last.y + last.height;
    }, [heatLayouts]);

    const finalRowCount = Math.max(finalRows.length, 1);
    const finalCardHeight = FINAL_HEADER_H + CARD_PADDING_Y * 2 + finalRowCount * FINAL_ROW_H;
    const finalCardX = HEAT_CARD_W + COL_GAP;
    const finalCardY = Math.max(0, (totalHeatHeight - finalCardHeight) / 2);
    const canvasWidth = finalCardX + FINAL_CARD_W + OUTER_PADDING * 2;
    const canvasHeight = Math.max(totalHeatHeight, finalCardY + finalCardHeight) + OUTER_PADDING * 2;

    const linkLines = useMemo(() => {
        const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

        finalRows.forEach((row, rowIndex) => {
            if (row.sourceBlockId === null) return;
            const source = heatLayouts.find((layout) => layout.card.block.id === row.sourceBlockId);
            if (!source) return;

            const y2 =
                OUTER_PADDING +
                finalCardY +
                FINAL_HEADER_H +
                CARD_PADDING_Y +
                rowIndex * FINAL_ROW_H +
                FINAL_ROW_H / 2;

            lines.push({
                x1: OUTER_PADDING + source.x + source.width,
                y1: OUTER_PADDING + source.winnerY,
                x2: OUTER_PADDING + finalCardX,
                y2,
            });
        });

        return lines;
    }, [finalCardX, finalCardY, finalRows, heatLayouts]);

    if (!finalMatch || heatCards.length === 0) {
        return (
            <div className="p-4 text-center text-gray-400">
                HEATS_AND_FINAL 用の予選ブロックまたは決勝戦データが不足しています。
            </div>
        );
    }

    return (
        <div className="relative min-h-[360px] overflow-auto p-4 scrollbar-thin">
            <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
                <svg
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{ width: "100%", height: "100%", overflow: "visible" }}
                >
                    {linkLines.map((line, index) => {
                        const midX = line.x1 + (line.x2 - line.x1) / 2;
                        return (
                            <polyline
                                key={`heats-line-${index}`}
                                points={`${line.x1},${line.y1} ${midX},${line.y1} ${midX},${line.y2} ${line.x2},${line.y2}`}
                                fill="none"
                                stroke="#cbd5e1"
                                strokeWidth="2"
                            />
                        );
                    })}
                </svg>

                {heatLayouts.map((layout) => {
                    const isPlaying = layout.card.match?.status === "Playing";
                    const hasMyTeam = layout.card.rows.some((row) => row.teamId === activeMyTeamId);

                    let cardBorderClass = "border-gray-300 shadow-sm";
                    if (isPlaying) {
                        cardBorderClass = "border-green-500 ring-2 ring-green-400 shadow-md animate-pulse";
                    } else if (hasMyTeam) {
                        cardBorderClass = "border-amber-400 ring-2 ring-amber-300 shadow-md";
                    }

                    const cardBody = (
                        <>
                            <div className="border-b border-gray-100 px-3 py-1.5 text-xs font-bold tracking-wide text-gray-500">
                                {layout.card.block.name}
                            </div>
                            <div className="py-2">
                                {layout.card.rows.length > 0 ? (
                                    layout.card.rows.map((row) => {
                                        const isWinner = row.rank === 1;
                                        const isMyTeam = row.teamId === activeMyTeamId;

                                        return (
                                            <div
                                                key={`heat-row-${layout.card.block.id}-${row.id}`}
                                                className={`flex h-[28px] items-center justify-between px-3 text-[12px] ${
                                                    isMyTeam ? "bg-amber-50" : ""
                                                }`}
                                            >
                                                <span className={`truncate ${isWinner ? "font-bold text-dark" : "text-gray-600"}`}>
                                                    {row.label}
                                                </span>
                                                <span className={`font-mono ${isWinner ? "font-bold text-red-500" : "text-gray-500"}`}>
                                                    {row.score ?? "-"}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="px-3 py-2 text-[12px] text-gray-400">参加チーム未定</div>
                                )}
                            </div>
                        </>
                    );

                    const commonClassName = `absolute z-10 overflow-hidden rounded border bg-white transition-all hover:border-primary hover:shadow-md ${cardBorderClass}`;
                    const style = {
                        left: OUTER_PADDING + layout.x,
                        top: OUTER_PADDING + layout.y,
                        width: layout.width,
                        height: layout.height,
                    };

                    if (!layout.card.match) {
                        return (
                            <div key={`heat-card-${layout.card.block.id}`} className={commonClassName} style={style}>
                                {cardBody}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={`heat-card-${layout.card.block.id}`}
                            href={`/match/${layout.card.match.id}`}
                            scroll={false}
                            className={commonClassName}
                            style={style}
                        >
                            {cardBody}
                        </Link>
                    );
                })}

                <Link
                    href={`/match/${finalMatch.id}`}
                    scroll={false}
                    className="absolute z-10 overflow-hidden rounded border border-gray-300 bg-white shadow-sm transition-all hover:border-primary hover:shadow-md"
                    style={{
                        left: OUTER_PADDING + finalCardX,
                        top: OUTER_PADDING + finalCardY,
                        width: FINAL_CARD_W,
                        height: finalCardHeight,
                    }}
                >
                    <div className="border-b border-gray-100 px-3 py-1.5 text-xs font-bold tracking-wide text-gray-500">
                        {blockById.get(finalMatch.eventBlockId)?.name ?? "決勝"}
                    </div>
                    <div className="py-2">
                        {finalRows.map((row) => {
                            const isMyTeam = activeMyTeamId !== null && row.teamId === activeMyTeamId;

                            return (
                                <div
                                    key={`final-row-${row.id}`}
                                    className={`flex h-[30px] items-center justify-between px-3 text-[12px] ${
                                        isMyTeam ? "bg-amber-50" : ""
                                    }`}
                                >
                                    <span className={`truncate ${row.rank === 1 ? "font-bold text-dark" : "text-gray-600"}`}>
                                        {row.label}
                                    </span>
                                    <span className={`font-mono ${row.rank === 1 ? "font-bold text-red-500" : "text-gray-500"}`}>
                                        {row.score ?? "-"}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Link>
            </div>
        </div>
    );
};
