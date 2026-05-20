"use client";

import React, { type CSSProperties, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SubHeader from "src/components/layouts/subheader/SubHeader";
import HeaderEventCardList from "src/components/common/HeaderEventCardList";
import { WeatherBadge } from "../../../components/common/WeatherBadge";
import { useMyTeam } from "../../../hooks/useMyTeam";
import { useSportsFestData } from "../../../hooks/useSportsFestData";
import { useWeather } from "../../../hooks/useWeather";
import type { MatchWithEventIdType } from "../../../types/SportsFestDataTypes";

const VenueDivider = ({ name }: { name: string }) => (
  <div className="my-6 flex items-center gap-3 pt-4">
    <div className="h-px flex-1 bg-[#2d5a8e] opacity-30" />
    <span className="whitespace-nowrap text-sm font-bold tracking-wider text-[#2d5a8e]">
      {name}
    </span>
    <div className="h-px flex-1 bg-[#2d5a8e] opacity-30" />
  </div>
);

const hexToRgba = (hexColor: string | null | undefined, alpha: number) => {
  if (!hexColor) {
    return `rgba(45, 90, 142, ${alpha})`;
  }

  const normalized = hexColor.replace("#", "");
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return `rgba(45, 90, 142, ${alpha})`;
  }

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const CourtCell = ({
  label,
  teamsText,
  status,
  isMyTeam,
  eventName,
  eventColor,
  venueName,
  showEventAccent,
}: {
  label: string;
  teamsText: string;
  status: string;
  isMyTeam: boolean;
  eventName?: string;
  eventColor?: string | null;
  venueName?: string;
  showEventAccent?: boolean;
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
    if (!isPlaying && !isFinished) {
      bgColor = "bg-amber-50 hover:bg-amber-100";
    }
  }

  const eventMarkerStyle: CSSProperties | undefined = showEventAccent
    ? {
        boxShadow: `inset 0 -0.55em 0 ${hexToRgba(eventColor, 0.22)}`,
      }
    : undefined;

  return (
    <div
      className={`flex h-full min-h-[6.25rem] flex-col justify-center rounded-lg p-2 text-center transition-transform active:scale-95 ${bgColor} ${borderColor}`}
    >
      {showEventAccent && eventName ? (
        <div className="mb-1 flex items-center justify-center">
          <span
            className={`max-w-full truncate px-1 text-[10px] font-semibold ${
              isPlaying ? "text-white/85" : "text-[#315d90]"
            }`}
            style={eventMarkerStyle}
          >
            {eventName}
          </span>
        </div>
      ) : null}

      <p
        className={`mb-1 text-[10px] font-bold ${
          isPlaying ? "text-blue-200" : isFinished ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {label}
      </p>

      <p className={`whitespace-pre-line text-sm font-semibold leading-tight ${textColor}`}>
        {teamsText}
      </p>

      {showEventAccent && venueName ? (
        <p
          className={`mt-1 truncate text-[10px] ${
            isPlaying ? "text-white/80" : isFinished ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {venueName}
        </p>
      ) : null}
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
  weather,
  eventMap,
  locationNameMap,
  horizontalScrollable,
}: {
  time: string;
  matches: MatchWithEventIdType[];
  done: boolean;
  teamsMap: Map<number, { name: string }>;
  matchesMap: Map<number, MatchWithEventIdType>;
  blocksMap: Map<number, { name: string }>;
  myTeamId: number | null;
  weather?: {
    code: number;
    prob: number | null;
    temp?: number | null;
    precip?: number | null;
  } | null;
  eventMap: Map<number, { name: string; color: string | null }>;
  locationNameMap: Map<number, string>;
  horizontalScrollable?: boolean;
}) => (
  <div className="relative mb-2">
    <div className="relative z-10 flex items-center gap-3">
      <div
        className={`h-4 w-4 flex-shrink-0 rounded-full border-[3px] bg-white ${
          done ? "border-gray-300" : "border-[#2d5a8e]"
        }`}
      />
      <span
        className={`text-sm font-bold tracking-wider ${
          done ? "text-gray-400" : "text-[#2d5a8e]"
        }`}
      >
        {time}
      </span>
      <WeatherBadge weather={weather} done={done} variant="full" />
    </div>

    <div className="ml-[7px] border-l-2 border-gray-100 pb-8 pl-[30px] pt-4">
      <div className={horizontalScrollable ? "overflow-x-auto overflow-y-hidden scrollbar-none" : ""}>
        <div className={`flex gap-2 ${horizontalScrollable ? "w-max flex-nowrap pr-2" : "flex-wrap"}`}>
          {matches.map((match) => {
            const isMyTeam = myTeamId
              ? match.participants.some((participant) => participant.teamId === myTeamId)
              : false;
            const event = eventMap.get(match.eventId);
            const locationName = match.locationId
              ? (locationNameMap.get(match.locationId) ?? "会場未設定")
              : "会場未設定";

            const teamsText = match.participants
              .map((participant) => {
                if (participant.teamId) {
                  return teamsMap.get(participant.teamId)?.name ?? "未定";
                }

                if (participant.prereqMatchId) {
                  const prereqMatch = matchesMap.get(participant.prereqMatchId);
                  return prereqMatch?.name ? `${prereqMatch.name} 勝者` : "未定 勝者";
                }

                if (participant.prereqBlockId) {
                  const prereqBlock = blocksMap.get(participant.prereqBlockId);
                  const rankText = participant.prereqRank ? `${participant.prereqRank}位` : "順位";
                  return prereqBlock?.name
                    ? `${prereqBlock.name} ${rankText}`
                    : `未定 ${rankText}`;
                }

                return "未定";
              })
              .join("\n");

            return (
              <Link
                href={`/match/${match.id}`}
                scroll={false}
                key={match.id}
                className={`block flex-none max-w-full ${
                  horizontalScrollable ? "w-[10rem]" : "min-w-[4.5rem]"
                }`}
              >
                <CourtCell
                  label={match.name || "試合"}
                  teamsText={teamsText}
                  status={match.status}
                  isMyTeam={isMyTeam}
                  eventName={event?.name}
                  eventColor={event?.color}
                  venueName={locationName}
                  showEventAccent={horizontalScrollable}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

const SimpleSlot = ({
  time,
  match,
  done,
  isMyTeam,
  weather,
}: {
  time: string;
  match: MatchWithEventIdType;
  done: boolean;
  isMyTeam: boolean;
  weather?: {
    code: number;
    prob: number | null;
    temp?: number | null;
    precip?: number | null;
  } | null;
}) => (
  <div className="relative mb-2">
    <Link
      href={`/match/${match.id}`}
      scroll={false}
      className="relative z-10 flex items-center gap-3 py-2 transition-transform active:scale-95"
    >
      <div
        className={`h-4 w-4 flex-shrink-0 rounded-full border-[3px] bg-white ${
          done ? "border-gray-300" : "border-[#2d5a8e]"
        }`}
      />
      <span className={`text-sm tracking-wider ${done ? "text-gray-400" : "font-bold text-gray-600"}`}>
        {time}
      </span>
      <WeatherBadge weather={weather} done={done} variant="simple" />
      <span
        className={`text-sm font-bold ${done ? "text-gray-400" : "text-dark"} ${
          isMyTeam ? "text-amber-600" : ""
        }`}
      >
        {match.name || match.description || "種目"}
      </span>
    </Link>
    <div className="ml-[7px] h-6 border-l-2 border-gray-100" />
  </div>
);

export default function SchedulePage() {
  const { matches, teams, maps, locations, eventBlocks, events, isLoading, dayLabelConverter } =
    useSportsFestData();
  const { myTeamId } = useMyTeam();
  const { getWeatherForTime } = useWeather();

  const [activeDay, setActiveDay] = useState<string>("Day1");
  const [selectedEventId, setSelectedEventId] = useState<number | "all">("all");

  const teamsMap = useMemo(() => new Map(teams?.map((team) => [team.id, team])), [teams]);
  const matchesMap = useMemo(() => new Map(matches?.map((match) => [match.id, match])), [matches]);
  const blocksMap = useMemo(
    () => new Map(eventBlocks?.map((block) => [block.id, block])),
    [eventBlocks],
  );
  const eventMap = useMemo(() => new Map(events?.map((event) => [event.id, event])), [events]);
  const locationNameMap = useMemo(
    () => new Map(locations?.map((location) => [location.id, location.name])),
    [locations],
  );

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
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
    if (!matches || matches.length === 0) {
      return [];
    }

    type TimelineGroup = {
      venueName: string;
      timeLabel: string;
      startTimeMs: number;
      endTimeMs: number;
      matches: MatchWithEventIdType[];
    };

    const groups: Record<string, TimelineGroup> = {};
    const isAllEventsMode = selectedEventId === "all";

    matches.forEach((match) => {
      const dayLabel = dayLabelConverter(new Date(match.scheduledStartTime));
      if (dayLabel !== activeDay) {
        return;
      }

      if (selectedEventId !== "all" && match.eventId !== selectedEventId) {
        return;
      }

      const startMs = new Date(match.scheduledStartTime).getTime();
      const endMs = new Date(match.scheduledEndTime).getTime();
      const timeLabel = `${formatTime(match.scheduledStartTime)} - ${formatTime(
        match.scheduledEndTime,
      )}`;

      let venueName = "全体スケジュール / 会場未設定";
      if (match.locationId && locations && maps) {
        const location = locations.find((item) => item.id === match.locationId);
        if (location) {
          const map = maps.find((item) => item.id === location.mapId);
          if (map) {
            venueName = map.displayName;
          }
        }
      }

      const groupKey = isAllEventsMode
        ? `${startMs}-${endMs}`
        : `${startMs}-${endMs}-${venueName}`;
      if (!groups[groupKey]) {
        groups[groupKey] = {
          venueName,
          timeLabel,
          startTimeMs: startMs,
          endTimeMs: endMs,
          matches: [],
        };
      }

      groups[groupKey].matches.push(match);
    });

    const items = Object.values(groups);
    items.sort((left, right) => {
      if (left.startTimeMs !== right.startTimeMs) {
        return left.startTimeMs - right.startTimeMs;
      }

      return left.venueName.localeCompare(right.venueName);
    });

    items.forEach((item) => {
      item.matches.sort((left, right) => {
        const leftLocation = left.locationId ? (locationNameMap.get(left.locationId) ?? "") : "";
        const rightLocation = right.locationId ? (locationNameMap.get(right.locationId) ?? "") : "";
        if (leftLocation !== rightLocation) {
          return leftLocation.localeCompare(rightLocation);
        }

        const leftEventName = eventMap.get(left.eventId)?.name ?? "";
        const rightEventName = eventMap.get(right.eventId)?.name ?? "";
        if (leftEventName !== rightEventName) {
          return leftEventName.localeCompare(rightEventName);
        }

        return left.id - right.id;
      });
    });

    return items;
  }, [matches, activeDay, selectedEventId, dayLabelConverter, locations, maps, locationNameMap, eventMap]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        スケジュールを読み込み中...
      </div>
    );
  }

  return (
    <>
      <SubHeader>
        <HeaderEventCardList activeEventId={selectedEventId} onEventChange={setSelectedEventId} />
      </SubHeader>

      <div className="flex min-h-screen flex-col bg-white">
        <div className="sticky top-0 z-20 flex border-b border-gray-200 bg-white">
          <button
            disabled={!dayAvailability.Day1}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              !dayAvailability.Day1
                ? "cursor-not-allowed bg-gray-50 text-gray-300"
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
                ? "cursor-not-allowed bg-gray-50 text-gray-300"
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
            <p className="mt-10 text-center text-gray-400">この日の試合はありません。</p>
          ) : (
            timelineItems.map((item, index) => {
              const isAllEventsMode = selectedEventId === "all";
              const previousVenueName = index > 0 ? timelineItems[index - 1]?.venueName : "";
              const showVenueDivider = !isAllEventsMode && previousVenueName !== item.venueName;
              const isSimple =
                !isAllEventsMode && item.matches.length === 1 && !item.matches[0].locationId;
              const isDone = item.matches.every(
                (match) =>
                  match.status === "Finished" ||
                  match.status === "Completed" ||
                  match.status === "Cancelled",
              );
              const weather = getWeatherForTime(item.startTimeMs);

              return (
                <React.Fragment key={`${item.startTimeMs}-${item.endTimeMs}-${item.venueName}`}>
                  {showVenueDivider ? <VenueDivider name={item.venueName} /> : null}

                  {isSimple ? (
                    <SimpleSlot
                      time={item.timeLabel}
                      match={item.matches[0]}
                      done={isDone}
                      isMyTeam={
                        myTeamId
                          ? item.matches[0].participants.some((participant) => participant.teamId === myTeamId)
                          : false
                      }
                      weather={weather}
                    />
                  ) : (
                    <TimeSlot
                      time={item.timeLabel}
                      matches={item.matches}
                      done={isDone}
                      teamsMap={teamsMap}
                      matchesMap={matchesMap}
                      blocksMap={blocksMap}
                      myTeamId={myTeamId ?? null}
                      weather={weather}
                      eventMap={eventMap}
                      locationNameMap={locationNameMap}
                      horizontalScrollable={isAllEventsMode}
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
