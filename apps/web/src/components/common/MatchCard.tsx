"use client";
import Link from "next/link";
import Image from "next/image";
import { MatchWithEventIdType } from "../../types/SportsFestDataTypes";
import { useSportsFestData } from "../../hooks/useSportsFestData";
import { formatStatusLabel, formatTimeLabel } from "../../lib/matchUtils";
import { ProgressBar } from "./ProgressBar";
import {useWatchlist} from "../../hooks/useWatchlist";

type MatchCardProps = {
    match: MatchWithEventIdType;
    showVenueLabel?: boolean;
    showStatusLabel?: boolean;
    showProgress?: boolean;
    isWatchlisted?: boolean;
    className?: string;
};

const MatchCard = ({
                       match,
                       showVenueLabel = true,
                       showStatusLabel = true,
                       showProgress = true,
                       className = "",
                   }: MatchCardProps) => {
    
    const { isLoading, dayLabelConverter, getEvent, getLocation, getMatchTeamsLabel } = useSportsFestData();
    const { isWatched } = useWatchlist();
    

    if (isLoading) return null;

    // データ解決
    const event = getEvent(match.eventId);
    const color = event?.color ?? "#FFFFFF";
    const eventName = event?.name ?? "";
    const dayLabel = dayLabelConverter(new Date(match.scheduledStartTime));
    const timeLabel = formatTimeLabel(match.scheduledStartTime);
    const venue = match.locationId ? getLocation(match.locationId) : null;
    const statusLabel = formatStatusLabel(match.status);
    const teamsNames = getMatchTeamsLabel(match.participants);
    const watched = isWatched(match.id);

    return (
    <Link href={`/match/${match.id}`} className="block w-full">
        <article
            className={`flex h-24 w-full flex-col justify-center gap-1 rounded-[10px] px-4 py-2 text-white shadow-[0_0_2px_rgba(0,0,0,0.08)] transition-transform active:scale-[0.98] ${className}`}
            style={{ backgroundColor: color }}
        >
            <div className="flex h-[17px] w-full items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div onClick={(e) => {
                        // Linkによるページ遷移を防ぐ（ウォッチリストボタン用）
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("ウォッチリスト処理");
                    }}>
                        <Image
                            src={watched ? "/icons/watchlist-on-icon.svg" : "/icons/watchlist-off-icon.svg"}
                            alt=""
                            width={10}
                            height={13}
                            className="h-[13px] w-[10px] shrink-0"
                        />
                    </div>
                    <p className="truncate text-[8px] font-medium leading-normal">{eventName}</p>
                </div>
                {showVenueLabel && venue?.name && (
                    <p className="min-w-0 flex-1 truncate text-right text-[8px] leading-normal">{venue.name}</p>
                )}
            </div>

            <p className="truncate text-base leading-normal font-bold">{teamsNames}</p>

            <div className="flex w-full items-center justify-between gap-3 text-white">
                <p className="min-w-0 truncate text-[10px] leading-normal">
                    <span>{dayLabel}</span>
                    <span className="ml-2">{timeLabel}</span>
                </p>
                {showStatusLabel && statusLabel && (
                    <p className="shrink-0 text-right text-[8px] leading-normal">{statusLabel}</p>
                )}
            </div>

            {showProgress && match.status === "Playing" && (
                <ProgressBar
                    scheduledStartTime={match.scheduledStartTime}
                    scheduledEndTime={match.scheduledEndTime}
                    startedAt={match.startedAt}
                />
            )}
        </article>
    </Link>
);
};

export default MatchCard;