"use client";

import React, {useEffect, useMemo, useState} from "react";
import Link from "next/link";
import SubHeader from "src/components/layouts/subheader/SubHeader";
import HeaderEventCardList from "src/components/common/HeaderEventCardList";
import {useSportsFestData} from "../../../hooks/useSportsFestData";
import {useMyTeam} from "../../../hooks/useMyTeam";
import {MatchWithEventIdType} from "../../../types/SportsFestDataTypes";
import {useWeather} from "../../../hooks/useWeather";
import {WeatherBadge} from "../../../components/common/WeatherBadge";

// ==========================================
// 1. 各種UIコンポーネント
// ==========================================

const VenueDivider = ({name}: { name: string }) => (
    <div className="flex items-center gap-3 my-6 pt-4">
        <div className="flex-1 h-px bg-[#2d5a8e] opacity-30"/>
        <span className="text-sm font-bold text-[#2d5a8e] whitespace-nowrap tracking-wider">{name}</span>
        <div className="flex-1 h-px bg-[#2d5a8e] opacity-30"/>
    </div>
);

const CourtCell = ({
                       label,
                       teamsText,
                       status,
                       isMyTeam
                   }: {
    label: string,
    teamsText: string,
    status: string,
    isMyTeam: boolean
}) => {
    const isPlaying = status === "Playing";
    const isFinished = status === "Finished" || status === "Completed";

    let bgColor = "bg-gray-100 hover:bg-gray-200";
    let textColor = "text-dark";
    let borderColor = "border-transparent";

    if (isPlaying) {
        bgColor = "bg-[#2d5a8e] shadow-md animate-pulse";
        textColor = "text-white";
    } else if (isFinished) {
        bgColor = "bg-gray-200/50";
        textColor = "text-gray-400";
    }

    if (isMyTeam) {
        borderColor = "border-amber-400 border-[2px]";
        if (!isPlaying && !isFinished) bgColor = "bg-amber-50 hover:bg-amber-100";
    }

    return (
        <div
            className={`rounded-lg p-2 text-center h-full flex flex-col justify-center transition-transform active:scale-95 ${bgColor} ${borderColor}`}>
            <p className={`text-[10px] mb-1 font-bold ${isPlaying ? "text-blue-200" : isFinished ? "text-gray-400" : "text-gray-500"}`}>
                {label}
            </p>
            <p className={`text-sm font-semibold leading-tight whitespace-pre-line ${textColor}`}>
                {teamsText}
            </p>
        </div>
    );
};

const TimeSlot = ({
                      time,
                      matches,
                      done,
                      teamsMap,
                      matchesMap,
                      blocksMap,
                      myTeamId,
                      weather
                  }: {
    time: string,
    matches: MatchWithEventIdType[],
    done: boolean,
    teamsMap: Map<number, { name: string }>,
    matchesMap: Map<number, MatchWithEventIdType>,
    blocksMap: Map<number, any>,
    myTeamId: number | null,
    weather?: { code: number; prob: number } | null
}) => (
    <div className="mb-2 relative">
        <div className="flex items-center gap-3 relative z-10">
            <div
                className={`w-4 h-4 rounded-full border-[3px] flex-shrink-0 bg-white ${done ? "border-gray-300" : "border-[#2d5a8e]"}`}/>
            <span
                className={`text-sm font-bold tracking-wider ${done ? "text-gray-400" : "text-[#2d5a8e]"}`}>{time}</span>
            {/* 天気 */}
            <WeatherBadge weather={weather} done={done} variant="full" />
        </div>

        <div className="pl-[30px] border-l-2 border-gray-100 ml-[7px] pb-8 -mt-2 pt-4">
            <div className="flex flex-wrap gap-2">
                {matches.map(m => {
                    const isMyTeam = myTeamId ? m.participants.some(p => p.teamId === myTeamId) : false;

                    const teamsText = m.participants.map(p => {
                        if (p.teamId) return teamsMap.get(p.teamId)?.name ?? "未定";

                        if (p.prereqMatchId) {
                            const prereqMatch = matchesMap.get(p.prereqMatchId);
                            return prereqMatch?.name ? `${prereqMatch.name} 勝者` : "未定の勝者";
                        }

                        if (p.prereqBlockId) {
                            const prereqBlock = blocksMap.get(p.prereqBlockId);
                            const rankText = p.prereqRank ? `${p.prereqRank}位` : "代表";
                            return prereqBlock?.name ? `${prereqBlock.name} ${rankText}` : `未定の${rankText}`;
                        }

                        return "未定";
                    }).join("\n");

                    return (
                        <Link
                            href={`/match/${m.id}`}
                            key={m.id}
                            className="block flex-none min-w-[4.5rem] max-w-full"
                        >
                            <CourtCell
                                label={m.name || "試合"}
                                teamsText={teamsText}
                                status={m.status}
                                isMyTeam={isMyTeam}
                            />
                        </Link>
                    );
                })}
            </div>
        </div>
    </div>
);

const SimpleSlot = ({
                        time,
                        match,
                        done,
                        isMyTeam,
                        weather
                    }: {
    time: string,
    match: MatchWithEventIdType,
    done: boolean,
    isMyTeam: boolean,
    weather?: { code: number; prob: number } | null
}) => (
    <div className="mb-2 relative">
        <Link href={`/match/${match.id}`}
              className="flex items-center gap-3 relative z-10 py-2 active:scale-95 transition-transform">
            <div
                className={`w-4 h-4 rounded-full border-[3px] flex-shrink-0 bg-white ${done ? "border-gray-300" : "border-[#2d5a8e]"}`}/>
            <span
                className={`text-sm tracking-wider ${done ? "text-gray-400" : "text-gray-600 font-bold"}`}>{time}</span>

            {/* 共通コンポーネントを呼び出し (simpleバリアント) */}
            <WeatherBadge weather={weather} done={done} variant="simple" />

            <span
                className={`text-sm font-bold ${done ? "text-gray-400" : "text-dark"} ${isMyTeam ? "text-amber-600" : ""}`}>
        {match.name || match.description || "予定"}
      </span>
        </Link>
        <div className="border-l-2 border-gray-100 ml-[7px] h-6"/>
    </div>
);

// ==========================================
// 2. メインページコンポーネント
// ==========================================

export default function SchedulePage() {
    const {matches, teams, maps, locations, eventBlocks, isLoading, dayLabelConverter} = useSportsFestData();
    const {myTeamId} = useMyTeam();

    // カスタムフックから関数を展開
    const { getWeatherForTime } = useWeather();

    const [activeDay, setActiveDay] = useState<string>("Day1");
    const [selectedEventId, setSelectedEventId] = useState<number | "all">("all");

    const teamsMap = useMemo(() => new Map(teams?.map(t => [t.id, t])), [teams]);
    const matchesMap = useMemo(() => new Map(matches?.map(m => [m.id, m])), [matches]);
    const blocksMap = useMemo(() => new Map(eventBlocks?.map(b => [b.id, b])), [eventBlocks]);

    const formatTime = (isoString: string) => {
        const d = new Date(isoString);
        return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    };

    const dayAvailability = useMemo(() => {
        const availability = {
            Day1: false,
            Day2: false,
        };

        if (!matches || matches.length === 0) {
            return availability;
        }

        matches.forEach((match) => {
            if (selectedEventId !== "all" && match.eventId !== selectedEventId) {
                return;
            }

            const dayLabel = dayLabelConverter(new Date(match.scheduledStartTime));
            if (dayLabel === "Day1" || dayLabel === "Day2") {
                availability[dayLabel] = true;
            }
        });

        return availability;
    }, [matches, selectedEventId, dayLabelConverter]);

    useEffect(() => {
        if (dayAvailability[activeDay as "Day1" | "Day2"]) {
            return;
        }

        if (dayAvailability.Day1) {
            setActiveDay("Day1");
            return;
        }

        if (dayAvailability.Day2) {
            setActiveDay("Day2");
        }
    }, [activeDay, dayAvailability]);

    const timelineItems = useMemo(() => {
        if (!matches || matches.length === 0) return [];
        type TimelineGroup = {
            venueName: string;
            timeLabel: string;
            startTimeMs: number;
            endTimeMs: number;
            matches: MatchWithEventIdType[];
        };

        const groups: Record<string, TimelineGroup> = {};

        matches.forEach(match => {
            const dayLabel = dayLabelConverter(new Date(match.scheduledStartTime));
            if (dayLabel !== activeDay) return;

            if (selectedEventId !== "all" && match.eventId !== selectedEventId) {
                return;
            }

            const startMs = new Date(match.scheduledStartTime).getTime();
            const endMs = new Date(match.scheduledEndTime).getTime();
            const timeLabel = `${formatTime(match.scheduledStartTime)} - ${formatTime(match.scheduledEndTime)}`;

            let venueName = "全体スケジュール / 場所指定なし";
            if (match.locationId && locations && maps) {
                const loc = locations.find(l => l.id === match.locationId);
                if (loc) {
                    const map = maps.find(m => m.id === loc.mapId);
                    if (map) venueName = map.displayName;
                }
            }

            const groupKey = `${startMs}-${endMs}-${venueName}`;
            if (!groups[groupKey]) {
                groups[groupKey] = {venueName, timeLabel, startTimeMs: startMs, endTimeMs: endMs, matches: []};
            }
            groups[groupKey].matches.push(match);
        });

        const items = Object.values(groups);
        items.sort((a, b) => {
            if (a.startTimeMs !== b.startTimeMs) return a.startTimeMs - b.startTimeMs;
            return a.venueName.localeCompare(b.venueName);
        });

        return items;
    }, [matches, activeDay, selectedEventId, dayLabelConverter, locations, maps]);

    if (isLoading) {
        return <div
            className="flex h-screen items-center justify-center text-gray-500">スケジュールを読み込み中...</div>;
    }

    let currentVenue = "";

    return (
        <>
            <SubHeader>
                <HeaderEventCardList
                    activeEventId={selectedEventId}
                    onEventChange={setSelectedEventId}
                />
            </SubHeader>

            <div className="bg-white min-h-screen flex flex-col">
                <div className="flex border-b border-gray-200 sticky top-0 bg-white z-20">
                    <button
                        disabled={!dayAvailability.Day1}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${
                            !dayAvailability.Day1
                                ? "cursor-not-allowed text-gray-300 bg-gray-50"
                                : activeDay === "Day1"
                                    ? "border-b-[3px] border-[#2d5a8e] text-[#2d5a8e]"
                                    : "text-gray-400 hover:bg-gray-50"
                        }`}
                        onClick={() => setActiveDay("Day1")}
                    >
                        1日目
                    </button>
                    <button
                        disabled={!dayAvailability.Day2}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${
                            !dayAvailability.Day2
                                ? "cursor-not-allowed text-gray-300 bg-gray-50"
                                : activeDay === "Day2"
                                    ? "border-b-[3px] border-[#2d5a8e] text-[#2d5a8e]"
                                    : "text-gray-400 hover:bg-gray-50"
                        }`}
                        onClick={() => setActiveDay("Day2")}
                    >
                        2日目
                    </button>
                </div>

                <div className="px-5 py-4 pb-24">
                    {timelineItems.length === 0 ? (
                        <p className="text-center text-gray-400 mt-10">この日の予定はありません。</p>
                    ) : (
                        timelineItems.map((item, i) => {
                            const showVenueDivider = currentVenue !== item.venueName;
                            if (showVenueDivider) currentVenue = item.venueName;

                            const isSimple = item.matches.length === 1 && !item.matches[0].locationId;
                            const isDone = item.matches.every(m => m.status === "Finished" || m.status === "Completed");

                            // カスタムフックの関数を使って天気を取得
                            const weather = getWeatherForTime(item.startTimeMs);

                            return (
                                <React.Fragment key={i}>
                                    {showVenueDivider && <VenueDivider name={item.venueName}/>}

                                    {isSimple ? (
                                        <SimpleSlot
                                            time={item.timeLabel}
                                            match={item.matches[0]}
                                            done={isDone}
                                            isMyTeam={myTeamId ? item.matches[0].participants.some(p => p.teamId === myTeamId) : false}
                                            weather={weather}
                                        />
                                    ) : (
                                        <TimeSlot
                                            time={item.timeLabel}
                                            matches={item.matches}
                                            done={isDone}
                                            teamsMap={teamsMap}
                                            myTeamId={myTeamId ?? null}
                                            matchesMap={matchesMap}
                                            blocksMap={blocksMap}
                                            weather={weather}
                                        />
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
}
