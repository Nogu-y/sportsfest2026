"use client";

import { useState } from "react";
import { useSportsFestData } from "../../hooks/useSportsFestData";
import { LeagueTable } from "./LeagueTable";
import { TournamentTable } from "./TournamentTable";

export const EventBracket = ({ eventId }: { eventId: number }) => {
    const { events, eventBlocks, isLoading } = useSportsFestData();
    const [activeBlockId, setActiveBlockId] = useState<number | null>(null);

    if (isLoading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

    const event = events.find(e => e.id === eventId);
    const blocks = eventBlocks?.filter(b => b.eventId === eventId) || [];

    if (!event || blocks.length === 0) {
        return (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                この種目には対戦表データがありません。
            </div>
        );
    }

    const currentBlockId = activeBlockId ?? blocks[0].id;
    const currentBlock = blocks.find(b => b.id === currentBlockId);

    return (
        <div className="w-full rounded-sm   p-4 ">
            <h2 className="mb-4 text-xl  ">{event.name}</h2>

            {/* ブロック切り替えタブ */}
            {blocks.length > 1 && (
                <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-none pb-2">
                    {blocks.map((block) => (
                        <button
                            key={block.id}
                            onClick={() => setActiveBlockId(block.id)}
                            className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors whitespace-nowrap ${
                                currentBlockId === block.id
                                    ? "bg-dark text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                            {block.name}
                        </button>
                    ))}
                </div>
            )}

            <div className="w-full overflow-x-auto">
                <span className="text-xs text-gray-400 mb-2 block">※ 試合をタップすると詳細が開きます</span>
                {currentBlock?.type === "LEAGUE" && <LeagueTable block={currentBlock} />}
                {currentBlock?.type === "TOURNAMENT" && <TournamentTable block={currentBlock} />}
                {currentBlock?.type === "CUMULATIVE" && (
                    <div className="p-4 text-center text-gray-400">ランキング集計表（開発中）</div>
                )}
            </div>
        </div>
    );
};