"use client";

import { useEffect, useMemo, useState } from "react";
import HeaderEventCardList from "src/components/common/HeaderEventCardList";
import MatchCard from "src/components/common/MatchCard";
import HorizonTitle from "src/components/event/HorizonTitle";
import EventHero from "src/components/layouts/eventHero/EventHero";
import SubHeader from "src/components/layouts/subheader/SubHeader";
import Overview from "src/components/event/Overview";
import { useSportsFestData } from "../../../hooks/useSportsFestData";
import {EventBracket} from "../../../components/bracket/EventBracket";

export default function Events() {
    const { events, matches, isLoading } = useSportsFestData();

    // 選択中の種目IDを管理（初期値は"all"とし、データ取得後に最初の種目を自動選択）
    const [selectedEventId, setSelectedEventId] = useState<number | "all">("all");

    // マスタデータロード時に最初の競技を自動選択
    useEffect(() => {
        if (selectedEventId === "all" && events.length > 0) {
            setSelectedEventId(events[0].id);
        }
    }, [events, selectedEventId]);

    // 現在選択されている種目のデータをマスタから特定
    const currentEvent = useMemo(() => {
        const targetId = selectedEventId === "all" ? (events[0]?.id ?? 0) : selectedEventId;
        return events.find((e) => e.id === targetId);
    }, [events, selectedEventId]);

    // 選択中の種目に紐づく「進行中の試合」と「次の試合」, 「終了した試合」をフィルタリング
    const { inProgressMatches, upcomingMatches, resultMatches } = useMemo(() => {
        if (!matches || !currentEvent) return { inProgressMatches: [], upcomingMatches: [], resultMatches: [] };

        const eventMatches = matches.filter((m) => m.eventId === currentEvent.id);

        // 進行中の試合 (Playing)
        const inProgress = eventMatches.filter((m) => m.status === "Playing");

        // 次の試合 (Waiting または Preparing) ※開始時刻順にソート
        const upcoming = eventMatches
            .filter((m) => m.status === "Waiting" || m.status === "Preparing")
            .sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime());
        
        // 結果 (Finished, Completed, Cancelled)
        const result  = eventMatches
            .filter((m) => m.status === "Finished" || m.status === "Completed" || m.status === "Cancelled")
            .sort((a, b) => new Date(b.scheduledEndTime).getTime() - new Date(a.scheduledEndTime).getTime());

        return { inProgressMatches: inProgress, upcomingMatches: upcoming, resultMatches: result };
    }, [matches, currentEvent]);

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center text-gray-500">読み込み中...</div>;
    }

    if (!currentEvent) {
        return <div className="flex h-screen items-center justify-center text-gray-500">種目データがありません。</div>;
    }
    
    const getEventImageSrc = (eventId: number) => {
        return `/img/event-hero/${eventId}.webp`
    };

    return (
        <>
            {/* 種目セレクタ */}
            <SubHeader>
                <HeaderEventCardList
                    activeEventId={selectedEventId}
                    onEventChange={setSelectedEventId}
                    showAllOption={false}
                />
            </SubHeader>

            {/* ヒーローエリア */}
            <EventHero eventId={currentEvent.id}>
                <img
                    src={getEventImageSrc(currentEvent.id)}
                    alt={`${currentEvent.name}の画像`}
                    className="w-full h-auto "
                />
            </EventHero>

            {/* メインレイアウト */}
            <main className="space-y-4 p-6">

                <HorizonTitle text="概要" />
                <Overview eventId={currentEvent.id.toString()} key={currentEvent.id} />

                <HorizonTitle text="進行中" />
                <div className="flex gap-4 overflow-x-auto py-2 px-6 snap-x snap-mandatory scrollbar-none">
                    {inProgressMatches.length > 0 ? (
                        inProgressMatches.map((match) => (
                            <div key={match.id} className="snap-center shrink-0 w-[280px]">
                                <MatchCard match={match} />
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 py-2">現在進行中の試合はありません</p>
                    )}
                </div>

                <HorizonTitle text="以降の試合" />
                <div className="flex gap-4 overflow-x-auto py-2 px-6 snap-x snap-mandatory scrollbar-none">
                    {upcomingMatches.length > 0 ? (
                        upcomingMatches.map((match) => (
                            <div key={match.id} className="snap-center shrink-0 w-[280px]">
                                <MatchCard match={match} />
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 py-2">予定されている試合はありません</p>
                    )}
                </div>
                
                <HorizonTitle text="終了した試合" />
                <div className="flex gap-4 overflow-x-auto py-2 px-6 snap-x snap-mandatory scrollbar-none">
                    {resultMatches.length > 0 ? (
                        resultMatches.map((match) => (
                            <div key={match.id} className="snap-center shrink-0 w-[280px]">
                                <MatchCard match={match} />
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400 py-2">終了した試合はありません</p>
                    )}
                </div>
                
                <HorizonTitle text="対戦表"/>
                <EventBracket eventId={currentEvent.id}/>
            </main>
        </>
    );
}