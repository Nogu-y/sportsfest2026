"use client";

import React from "react";
import HeaderEventCard from "./HeaderEventCard";
import { useSportsFestData } from "../../hooks/useSportsFestData";

type HeaderEventCardListProps = {
    // 親コンポーネントから選択中の種目IDと、変更時のコールバックを受け取る
    activeEventId: number | "all";
    onEventChange: (eventId: number | "all") => void;
};

const HeaderEventCardList = ({
                                 activeEventId,
                                 onEventChange,
                             }: HeaderEventCardListProps) => {
    const { events, isLoading } = useSportsFestData();

    if (isLoading) return null; // 読み込み中は表示しない（またはスケルトン）

    return (
        <nav aria-label="種目">
            <ul className="flex w-full items-start gap-2 overflow-x-auto overflow-y-hidden scrollbar-none pb-2">
                {/* 「すべて」の選択肢 */}
                <li className="shrink-0 cursor-pointer" onClick={() => onEventChange("all")}>
                    <div className="pointer-events-none">
                        <HeaderEventCard
                            eventId={"all" as any}
                            label="すべて"
                            isActive={activeEventId === "all"}
                        />
                    </div>
                </li>

                {/* 動的に取得した種目リスト */}
                {events.map((event) => (
                    <li
                        key={event.id}
                        className="shrink-0 cursor-pointer transition-transform active:scale-95"
                        onClick={() => onEventChange(event.id)}
                    >
                        {/* ※ 既存のHeaderEventCardコンポーネントをそのまま活かすため、
               クリックイベントは親の <li> で受け取る設計にしています
             */}
                        <div className="pointer-events-none">
                            <HeaderEventCard
                                eventId={event.id.toString() as any}
                                label={event.name}
                                isActive={activeEventId === event.id}
                            />
                        </div>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default HeaderEventCardList;