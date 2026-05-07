import Image from "next/image";

export type MatchCardEventId =
  | "valleyball"
  | "relay"
  | "badminton"
  | "softtennis"
  | "softball"
  | "scavengerhunt"
  | "basketball";

type MatchCardProps = {
  eventId: MatchCardEventId;
  eventName: string;
  matchName: string;
  dayLabel: string;
  timeLabel: string;
  venueLabel?: string;
  statusLabel?: string;
  progress?: number;
  showVenueLabel?: boolean;
  showStatusLabel?: boolean;
  showProgress?: boolean;
  isWatchlisted?: boolean;
  className?: string;
};

const eventBackgroundClass: Record<MatchCardEventId, string> = {
  valleyball: "bg-[#1BAAE1]",
  relay: "bg-[#35A210]",
  badminton: "bg-[#88B63F]",
  softtennis: "bg-[#B8B831]",
  softball: "bg-[#CE8D2D]",
  scavengerhunt: "bg-[#3B6E9B]",
  basketball: "bg-[#C46DF0]",
};

const clampProgress = (value: number) => Math.min(100, Math.max(0, value));

const MatchCard = ({
  eventId,
  eventName,
  matchName,
  dayLabel,
  timeLabel,
  venueLabel,
  statusLabel,
  progress = 0,
  showVenueLabel = true,
  showStatusLabel = true,
  showProgress = true,
  isWatchlisted = false,
  className = "",
}: MatchCardProps) => {
  const progressValue = clampProgress(progress);

  return (
    <article
      className={`flex h-24 w-full flex-col justify-center gap-1 rounded-[10px] px-4 py-2 text-white shadow-[0_0_2px_rgba(0,0,0,0.08)] ${eventBackgroundClass[eventId]} ${className}`}
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

      <p className="truncate text-base leading-normal">{matchName}</p>

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

      {showProgress ? (
        <div
          className="h-[5px] w-full overflow-hidden rounded-full bg-black/45"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressValue}
        >
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      ) : null}
    </article>
  );
};

export default MatchCard;
export type { MatchCardProps };
