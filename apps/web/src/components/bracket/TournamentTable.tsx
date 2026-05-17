"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSportsFestData } from "../../hooks/useSportsFestData";

// デザイン定数 (ここでサイズを変えれば表全体の縮尺が連動して変わります)
const BOX_W = 200;  // 試合箱の幅
const BOX_H = 64;   // 試合箱の高さ (32px * 2チーム)
const GAP_X = 40;   // 列と列の間隔（線の長さ）
const GAP_Y = 24;   // 行と行の間隔

export const TournamentTable = ({ block }: { block: any }) => {
    const { matches, teams, eventBlocks } = useSportsFestData();

    // トーナメントのレイアウト計算（非常に軽量な再帰処理）
    const layout = useMemo(() => {
        const blockMatches = matches.filter(m => m.eventBlockId === block.id);

        // どの試合のprereqMatchIdにも指定されていない試合（＝決勝戦や3位決定戦）をルートとして抽出
        const roots = blockMatches.filter(m =>
            !blockMatches.some(other => other.participants.some(p => p.prereqMatchId === m.id))
        );

        // 各試合の列(深さ)を計算
        const getDepth = (matchId: number): number => {
            const match = blockMatches.find(m => m.id === matchId);
            if (!match) return 0;
            const d0 = match.participants[0]?.prereqMatchId ? getDepth(match.participants[0].prereqMatchId) : 0;
            const d1 = match.participants[1]?.prereqMatchId ? getDepth(match.participants[1].prereqMatchId) : 0;
            return Math.max(d0, d1) + 1;
        };

        const maxCols = Math.max(...roots.map(r => getDepth(r.id)));

        const nodes: any[] = [];
        const links: any[] = [];
        let globalRow = 0;

        // 右から左（決勝から1回戦）へ再帰的に遡りながらY座標を決定する
        const traverse = (matchId: number, col: number) => {
            const match = blockMatches.find(m => m.id === matchId);
            if (!match) return null;

            const p0 = match.participants[0];
            const p1 = match.participants[1];

            // 子ノード（左側）のY座標を決定
            let y0, y1;
            if (p0?.prereqMatchId) y0 = traverse(p0.prereqMatchId, col - 1)?.y;
            else { y0 = globalRow * (BOX_H + GAP_Y); globalRow += 1; }

            if (p1?.prereqMatchId) y1 = traverse(p1.prereqMatchId, col - 1)?.y;
            else { y1 = globalRow * (BOX_H + GAP_Y); globalRow += 1; }

            // 自分の座標を決定
            const myX = col * (BOX_W + GAP_X);
            const myY = y0 !== undefined && y1 !== undefined ? (y0 + y1) / 2 : y0 ?? y1 ?? 0;

            // 接続線の生成（子ノードの右端中央から、自分の左端 上下へ）
            if (p0?.prereqMatchId && y0 !== undefined) {
                const cx = (col - 1) * (BOX_W + GAP_X);
                links.push({ x1: cx + BOX_W, y1: y0 + BOX_H / 2, x2: myX, y2: myY + BOX_H / 4, isWinner: p0.rank === 1 });
            }
            if (p1?.prereqMatchId && y1 !== undefined) {
                const cx = (col - 1) * (BOX_W + GAP_X);
                links.push({ x1: cx + BOX_W, y1: y1 + BOX_H / 2, x2: myX, y2: myY + BOX_H * (3 / 4), isWinner: p1.rank === 1 });
            }

            const node = { match, x: myX, y: myY };
            nodes.push(node);
            return node;
        };

        roots.forEach(root => {
            traverse(root.id, maxCols - 1);
            globalRow += 0.5; // 決勝と3位決定戦の間にスペースを空ける
        });

        // 全体の幅と高さを計算
        return {
            nodes,
            links,
            width: maxCols * BOX_W + (maxCols - 1) * GAP_X,
            height: globalRow * (BOX_H + GAP_Y)
        };
    }, [matches, block.id]);

    // チーム名または勝ち上がり条件の文字列解決
    const getTeamLabel = (p: any) => {
        if (p.teamId) return teams.find(t => t.id === p.teamId)?.name ?? "未定";
        if (p.prereqBlockId) {
            const bName = eventBlocks?.find(b => b.id === p.prereqBlockId)?.name;
            return `${bName || "予選"} ${p.prereqRank || ""}位`;
        }
        return "未定";
    };

    return (
        <div className="relative overflow-auto p-4" style={{ minHeight: "300px" }}>
            <div className="relative" style={{ width: layout.width, height: layout.height }}>

                {/* 1. トーナメントの接続線を描画するSVGレイヤー */}
                <svg className="absolute inset-0 pointer-events-none z-0" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                    {layout.links.map((link, i) => {
                        const midX = link.x1 + GAP_X / 2; // 中間点でカクっと曲がる
                        return (
                            <polyline
                                key={`link-${i}`}
                                points={`${link.x1},${link.y1} ${midX},${link.y1} ${midX},${link.y2} ${link.x2},${link.y2}`}
                                fill="none"
                                stroke={link.isWinner ? "#ef4444" : "#cbd5e1"}
                                strokeWidth={link.isWinner ? "3" : "2"}
                            />
                        );
                    })}
                </svg>

                {/* 2. 試合ボックスのレイヤー */}
                {layout.nodes.map(({ match, x, y }) => (
                    <Link
                        key={match.id}
                        href={`/match/${match.id}`} // クリックで横取りモーダルが開く！
                        className="absolute z-10 flex flex-col rounded bg-white border border-gray-300 shadow-sm transition-all hover:border-primary hover:shadow-md"
                        style={{ left: x, top: y, width: BOX_W, height: BOX_H }}
                    >
                        {match.participants.map((p: any, i: number) => (
                            <div
                                key={i}
                                className={`flex flex-1 items-center justify-between px-3 text-[13px] ${i === 0 ? 'border-b border-gray-100' : ''} ${p.rank === 1 ? 'font-bold text-dark' : 'text-gray-600'}`}
                            >
                                <span className="truncate">{getTeamLabel(p)}</span>
                                <span className={`font-mono ${p.rank === 1 ? 'text-red-500' : ''}`}>{p.score ?? "-"}</span>
                            </div>
                        ))}
                        {/* 試合名ラベル (例: "決勝") */}
                        {match.name && (
                            <div className="absolute -top-5 left-0 text-xs font-bold text-gray-400">
                                {match.name}
                            </div>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
};