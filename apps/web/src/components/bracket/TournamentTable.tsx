"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSportsFestData } from "../../hooks/useSportsFestData";
import { useMyTeam } from "../../hooks/useMyTeam"; // ★ 自クラスフックの導入
import type { PublicMasterResponse } from "../../../../api/src/schemas/public/master";

const BOX_W = 200;  // 試合箱の幅
const BOX_H = 64;   // 試合箱の高さ
const GAP_X = 40;   // 列間隔
const GAP_Y = 28;   // 行間隔
const STAGE_ORDER: Record<string, number> = {
    ROUND_1: 0,
    ROUND_2: 1,
    QUARTERFINAL: 2,
    SEMIFINAL: 3,
    FINAL: 4,
    CONSOLATION: 5,
    QUALIFIER: 0,
};

const getStageOrder = (match: any) => STAGE_ORDER[match.stage] ?? 0;

type PreviewData = {
    matches: PublicMasterResponse["matches"];
    teams: PublicMasterResponse["teams"];
    eventBlocks?: PublicMasterResponse["blocks"];
    myTeamId?: number | null;
};

export const TournamentTable = ({ block, previewData }: { block: any; previewData?: PreviewData }) => {
    const sportsFestData = useSportsFestData();
    const { myTeamId } = useMyTeam(); // ★ グローバルな選択チームIDを直接取得
    const matches = previewData?.matches ?? sportsFestData.matches;
    const teams = previewData?.teams ?? sportsFestData.teams;
    const eventBlocks = previewData?.eventBlocks ?? sportsFestData.eventBlocks;
    const activeMyTeamId = previewData && "myTeamId" in previewData ? previewData.myTeamId : myTeamId;

    const blockMatches = useMemo(
        () => matches.filter((m: any) => m.eventBlockId === block.id),
        [matches, block.id]
    )

    const mainBracketMatches = useMemo(
        () => blockMatches.filter((m: any) => m.stage !== "THIRD_PLACE"),
        [blockMatches]
    )

    const layoutMatches = useMemo(() => {
        const inferSourceMatch = (match: any, participant: any) => {
            if (participant.prereqMatchId || participant.teamId == null) return null;

            const currentStageOrder = getStageOrder(match);
            return mainBracketMatches
                .filter((candidate: any) =>
                    candidate.id !== match.id &&
                    getStageOrder(candidate) < currentStageOrder &&
                    (candidate.participants ?? []).some((sourceParticipant: any) =>
                        sourceParticipant.teamId === participant.teamId &&
                        sourceParticipant.rank === 1,
                    ),
                )
                .sort((left: any, right: any) => {
                    const stageDiff = getStageOrder(right) - getStageOrder(left);
                    if (stageDiff !== 0) return stageDiff;

                    const timeDiff =
                        new Date(right.scheduledStartTime).getTime() -
                        new Date(left.scheduledStartTime).getTime();
                    if (timeDiff !== 0) return timeDiff;

                    return right.id - left.id;
                })[0] ?? null;
        };

        return mainBracketMatches.map((match: any) => ({
            ...match,
            participants: (match.participants ?? []).map((participant: any) => {
                const sourceMatch = inferSourceMatch(match, participant);
                if (!sourceMatch) return participant;

                return {
                    ...participant,
                    prereqMatchId: sourceMatch.id,
                    prereqRank: participant.prereqRank ?? 1,
                };
            }),
        }));
    }, [mainBracketMatches]);

    const thirdPlaceMatches = useMemo(
        () => blockMatches.filter((m: any) => m.stage === "THIRD_PLACE"),
        [blockMatches]
    )

    const buildLayout = (targetMatches: any[]) => {
        if (targetMatches.length === 0) {
            return { nodes: [], links: [], width: BOX_W, height: BOX_H + GAP_Y };
        }

        const hasPrereqLink = targetMatches.some((match: any) =>
            (match.participants ?? []).some((participant: any) => participant.prereqMatchId),
        );

        if (!hasPrereqLink) {
            return buildLayoutWithoutPrereq(targetMatches);
        }

        const roots = targetMatches.filter((m: any) =>
            !targetMatches.some((other: any) =>
                (other.participants ?? []).some((p: any) => p.prereqMatchId === m.id),
            )
        )

        if (roots.length === 0) {
            return buildLayoutWithoutPrereq(targetMatches);
        }

        const getDepth = (matchId: number): number => {
            const match = targetMatches.find((m: any) => m.id === matchId);
            if (!match) return 0;
            const participants = match.participants ?? [];
            const d0 = participants[0]?.prereqMatchId ? getDepth(participants[0].prereqMatchId) : 0;
            const d1 = participants[1]?.prereqMatchId ? getDepth(participants[1].prereqMatchId) : 0;
            return Math.max(d0, d1) + 1;
        };

        const maxCols = Math.max(...roots.map((r: any) => getDepth(r.id)), 1);
        const nodes: any[] = [];
        const links: any[] = [];
        const visitedNodes = new Map<number, any>();
        let globalRow = 0;

        const isSourceWinner = (participant: any) => {
            if (!participant?.prereqMatchId) return false;

            const sourceMatch = targetMatches.find((m: any) => m.id === participant.prereqMatchId);
            const sourceRank = participant.prereqRank ?? 1;
            return (sourceMatch?.participants ?? []).some((sourceParticipant: any) =>
                sourceParticipant.rank === sourceRank &&
                (participant.teamId == null || sourceParticipant.teamId === participant.teamId),
            );
        };

        const traverse = (matchId: number, col: number) => {
            const visited = visitedNodes.get(matchId);
            if (visited) return visited;

            const match = targetMatches.find((m: any) => m.id === matchId);
            if (!match) return null;

            const participants = match.participants ?? [];
            const p0 = participants[0];
            const p1 = participants[1];

            let y0, y1;
            if (p0?.prereqMatchId) y0 = traverse(p0.prereqMatchId, col - 1)?.y;
            else { y0 = globalRow * (BOX_H + GAP_Y); globalRow += 1; }

            if (p1?.prereqMatchId) y1 = traverse(p1.prereqMatchId, col - 1)?.y;
            else { y1 = globalRow * (BOX_H + GAP_Y); globalRow += 1; }

            const myX = col * (BOX_W + GAP_X);
            const myY: number = y0 !== undefined && y1 !== undefined ? (y0 + y1) / 2 : y0 ?? y1 ?? 0;

            if (p0?.prereqMatchId && y0 !== undefined) {
                const cx = (col - 1) * (BOX_W + GAP_X);
                links.push({ x1: cx + BOX_W, y1: y0 + BOX_H / 2, x2: myX, y2: myY + BOX_H / 4, isWinner: isSourceWinner(p0) });
            }
            if (p1?.prereqMatchId && y1 !== undefined) {
                const cx = (col - 1) * (BOX_W + GAP_X);
                links.push({ x1: cx + BOX_W, y1: y1 + BOX_H / 2, x2: myX, y2: myY + BOX_H * (3 / 4), isWinner: isSourceWinner(p1) });
            }

            const node = { match, x: myX, y: myY };
            nodes.push(node);
            visitedNodes.set(matchId, node);
            return node;
        };

        roots.forEach((root: any) => {
            traverse(root.id, getDepth(root.id) - 1);
            globalRow += 0.5;
        });

        return {
            nodes,
            links,
            width: maxCols * BOX_W + (maxCols - 1) * GAP_X,
            height: globalRow * (BOX_H + GAP_Y)
        }
    }

    const buildLayoutWithoutPrereq = (targetMatches: any[]) => {
        const stageBuckets = new Map<number, any[]>();

        for (const match of targetMatches) {
            const stageOrder = STAGE_ORDER[match.stage] ?? 0;
            const bucket = stageBuckets.get(stageOrder) ?? [];
            bucket.push(match);
            stageBuckets.set(stageOrder, bucket);
        }

        const orderedColumns = [...stageBuckets.entries()]
            .sort((left, right) => left[0] - right[0])
            .map(([, bucket]) =>
                bucket.sort((left: any, right: any) => {
                    const t = new Date(left.scheduledStartTime).getTime() - new Date(right.scheduledStartTime).getTime();
                    if (t !== 0) return t;
                    return left.id - right.id;
                }),
            );

        const nodes: any[] = [];
        const links: any[] = [];
        let maxRows = 1;

        orderedColumns.forEach((columnMatches, colIndex) => {
            maxRows = Math.max(maxRows, columnMatches.length);
            columnMatches.forEach((match: any, rowIndex: number) => {
                nodes.push({
                    match,
                    x: colIndex * (BOX_W + GAP_X),
                    y: rowIndex * (BOX_H + GAP_Y),
                });
            });
        });

        for (let colIndex = 0; colIndex < orderedColumns.length - 1; colIndex += 1) {
            const currentColumn = orderedColumns[colIndex];
            const nextColumn = orderedColumns[colIndex + 1];
            if (currentColumn.length === 0 || nextColumn.length === 0) continue;

            nextColumn.forEach((_, nextIndex: number) => {
                const start = Math.floor((nextIndex * currentColumn.length) / nextColumn.length);
                const endExclusive = Math.floor(((nextIndex + 1) * currentColumn.length) / nextColumn.length);
                const sourceIndices = [...new Set([start, Math.max(start, endExclusive - 1)])]
                    .filter((index) => index >= 0 && index < currentColumn.length);

                const targetY = nextIndex * (BOX_H + GAP_Y) + BOX_H / 2;
                for (const sourceIndex of sourceIndices) {
                    const sourceY = sourceIndex * (BOX_H + GAP_Y) + BOX_H / 2;
                    links.push({
                        x1: colIndex * (BOX_W + GAP_X) + BOX_W,
                        y1: sourceY,
                        x2: (colIndex + 1) * (BOX_W + GAP_X),
                        y2: targetY,
                        isWinner: false,
                    });
                }
            });
        }

        return {
            nodes,
            links,
            width: orderedColumns.length * BOX_W + Math.max(orderedColumns.length - 1, 0) * GAP_X,
            height: maxRows * (BOX_H + GAP_Y),
        };
    };

    // 本線トーナメントのレイアウト計算（再帰処理）
    const layout = useMemo(() => buildLayout(layoutMatches), [layoutMatches])

    const getTeamLabel = (p: any) => {
        if (p.teamId) return teams.find((t: any) => t.id === p.teamId)?.name ?? "未定";
        if (p.prereqBlockId) {
            const bName = eventBlocks?.find((b: any) => b.id === p.prereqBlockId)?.name;
            return `${bName || "予選"} ${p.prereqRank || ""}位`;
        }
        return "未定";
    };

    const renderMatchCard = ({ match, x, y }: { match: any; x: number; y: number }) => {
        const isMyMatch = activeMyTeamId != null && match.participants?.some((p: any) => p.teamId === activeMyTeamId);
        const isPlaying = match.status === "Playing";

        let boxBorderClass = "border-gray-300 shadow-sm";
        if (isPlaying) {
            boxBorderClass = "border-green-500 ring-2 ring-green-400 shadow-md animate-pulse";
        } else if (isMyMatch) {
            boxBorderClass = "border-amber-400 ring-2 ring-amber-300 shadow-md transform scale-[1.01]";
        }

        return (
            <Link
                key={match.id}
                href={`/match/${match.id}`}
                scroll={false}
                className={`absolute z-10 flex flex-col rounded bg-white border transition-all hover:border-primary hover:shadow-md ${boxBorderClass}`}
                style={{ left: x, top: y, width: BOX_W, height: BOX_H }}
            >
                {match.participants.map((p: any, i: number) => {
                    return (
                        <div
                            key={i}
                            className={`flex flex-1 items-center justify-between px-3 text-[12px] transition-colors ${
                                i === 0 ? 'border-b border-gray-100' : ''
                            } ${
                                p.rank === 1 ? 'font-bold text-dark' : 'text-gray-500'
                            }`}
                        >
                            <span className="truncate flex items-center gap-1">
                                {getTeamLabel(p)}
                            </span>
                            <span className={`font-mono text-xs ${p.rank === 1 ? 'text-red-500 font-bold' : ''}`}>
                                {p.score ?? "-"}
                            </span>
                        </div>
                    );
                })}

                {match.name && (
                    <div className={`absolute -top-4.5 left-0.5 text-[10px] font-bold tracking-wide ${isMyMatch ? 'text-amber-600 font-black' : 'text-gray-400'}`}>
                        {match.name}
                    </div>
                )}
            </Link>
        )
    }

    const renderStandaloneMatchCard = (match: any) => {
        const isMyMatch = activeMyTeamId != null && match.participants?.some((p: any) => p.teamId === activeMyTeamId);
        const isPlaying = match.status === "Playing";

        let boxBorderClass = "border-gray-300 shadow-sm";
        if (isPlaying) {
            boxBorderClass = "border-green-500 ring-2 ring-green-400 shadow-md animate-pulse";
        } else if (isMyMatch) {
            boxBorderClass = "border-amber-400 ring-2 ring-amber-300 shadow-md transform scale-[1.01]";
        }

        return (
            <Link
                key={`third-${match.id}`}
                href={`/match/${match.id}`}
                scroll={false}
                className={`relative z-10 flex flex-col rounded bg-white border transition-all hover:border-primary hover:shadow-md ${boxBorderClass}`}
                style={{ width: BOX_W, height: BOX_H }}
            >
                {match.participants.map((p: any, i: number) => {
                    return (
                        <div
                            key={i}
                            className={`flex flex-1 items-center justify-between px-3 text-[12px] transition-colors ${
                                i === 0 ? 'border-b border-gray-100' : ''
                            } ${
                                p.rank === 1 ? 'font-bold text-dark' : 'text-gray-500'
                            }`}
                        >
                            <span className="truncate flex items-center gap-1">
                                {getTeamLabel(p)}
                            </span>
                            <span className={`font-mono text-xs ${p.rank === 1 ? 'text-red-500 font-bold' : ''}`}>
                                {p.score ?? "-"}
                            </span>
                        </div>
                    );
                })}

                {match.name && (
                    <div className={`absolute -top-4.5 left-0.5 text-[10px] font-bold tracking-wide ${isMyMatch ? 'text-amber-600 font-black' : 'text-gray-400'}`}>
                        {match.name}
                    </div>
                )}
            </Link>
        )
    }

    return (
        <div className="relative overflow-auto p-4 min-h-[350px] scrollbar-thin">
            <div className="relative" style={{ width: layout.width, height: layout.height }}>

                {/* 1. トーナメントの接続線（SVG） */}
                <svg className="absolute inset-0 pointer-events-none z-0" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                    {layout.links.map((link, i) => {
                        const midX = link.x1 + GAP_X / 2;
                        return (
                            <polyline
                                key={`link-${i}`}
                                points={`${link.x1},${link.y1} ${midX},${link.y1} ${midX},${link.y2} ${link.x2},${link.y2}`}
                                fill="none"
                                stroke={link.isWinner ? "#ef4444" : "#cbd5e1"}
                                strokeWidth={link.isWinner ? "2.5" : "1.5"}
                            />
                        );
                    })}
                </svg>

                {/* 2. 試合ボックスの配置 */}
                {layout.nodes.map((node) => renderMatchCard(node))}
            </div>

            {thirdPlaceMatches.length > 0 && (
                <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-2 text-xs font-bold tracking-wide text-gray-500">3位決定戦</p>
                    <div className="flex flex-col gap-7 pt-4 pb-2 px-2">
                        {thirdPlaceMatches.map((match: any) => renderStandaloneMatchCard(match))}
                    </div>
                </div>
            )}
        </div>
    );
};
