import Image from "next/image";
import {MatchWithEventIdType} from "../../types/SportsFestDataTypes";
import {useSportsFestData} from "../../hooks/useSportsFestData";
import {formatStatusLabel, formatTimeLabel} from "../../lib/matchUtils";
import {ProgressBar} from "./ProgressBar";

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
                       isWatchlisted = false,
                       className = "",
                   }: MatchCardProps) => {
    const {isLoading, dayLabelConverter, getEvent, getLocation, getMatchTeamsLabel} = useSportsFestData()
    if (isLoading) return null

    const eventId = match.eventId
    const event = getEvent(eventId)
    const color = event?.color ?? "#FFFFFF"
    const eventName = event?.name ?? "";
    const dayLabel = dayLabelConverter(new Date(match.scheduledStartTime))
    const timeLabel = formatTimeLabel(match.scheduledStartTime)
    const venueLabel = match.locationId ? getLocation(match.locationId)?.name : ""
    const statusLabel = formatStatusLabel(match.status)
    const teamsNames = getMatchTeamsLabel(match.participants) // 対戦相手を並べてカードのメイン表示とする.

    return (
        <article
            className={`flex h-24 w-full flex-col justify-center gap-1 rounded-[10px] px-4 py-2 text-white shadow-[0_0_2px_rgba(0,0,0,0.08)]  ${className}`}
            style={{backgroundColor: color}}
        >
            <div className="flex h-[17px] w-full items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <Image
                        src={
                            isWatchlisted
                                ? "/icons/watchlist-on-icon.svg"
                                : "/icons/watchlist-off-icon.svg"
                        }
                        alt=""
                        width={10}
                        height={13}
                        aria-hidden="true"
                        className="h-[13px] w-[10px] shrink-0"
                    />
                    <p className="truncate text-[8px] leading-normal font-medium">
                        {eventName}
                    </p>
                </div>

                {showVenueLabel && venueLabel ? (
                    <p className="min-w-0 flex-1 truncate text-right text-[8px] leading-normal">
                        {venueLabel}
                    </p>
                ) : null}
            </div>

            {/*<p className="truncate text-base leading-normal">{matchName}</p>*/}
            <p className="truncate text-base leading-normal">{teamsNames}</p>

            <div className="flex w-full items-center justify-between gap-3 text-white">
                <p className="min-w-0 truncate text-[10px] leading-normal">
                    <span>{dayLabel}</span>
                    <span className="ml-2">{timeLabel}</span>
                </p>

                {showStatusLabel && statusLabel ? (
                    <p className="shrink-0 text-right text-[8px] leading-normal">
                        {statusLabel}
                    </p>
                ) : null}
            </div>

            {showProgress && match.status === "Playing" ? (
                <ProgressBar scheduledStartTime={match.scheduledStartTime} scheduledEndTime={match.scheduledEndTime}
                             startedAt={match.startedAt}/>
            ) : null}
        </article>
    );
};

export default MatchCard;
export type {MatchCardProps};
