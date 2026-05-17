import Image from "next/image";

export type HeaderEventCardEventId =
  | "valleyball"
  | "relay"
  | "badminton"
  | "softtennis"
  | "softball"
  | "scavengerhunt"
  | "basketball";

type HeaderEventCardProps = {
  eventId: HeaderEventCardEventId;
  label: string;
  isActive?: boolean;
};

const HeaderEventCard = ({
  eventId,
  label,
  isActive = false,
}: HeaderEventCardProps) => {
  const iconState = isActive ? "on" : "off";

  return (
    <button
      type="button"
      className={`flex shrink-0 flex-col items-center gap-1 overflow-hidden rounded px-2 py-1 ${
        isActive
          ? "bg-white text-primary"
          : "border border-white/50 text-white/50"
      }`}
      aria-pressed={isActive}
    >
      <Image
        src={`/icons/events/${eventId}-${iconState}-icon.svg`}
        alt=""
        width={32}
        height={32}
        aria-hidden="true"
        className="size-8"
      />
      <span className="whitespace-nowrap text-[8px] leading-normal">
        {label}
      </span>
    </button>
  );
};

export default HeaderEventCard;
