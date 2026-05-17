import HeaderEventCard, {
  type HeaderEventCardEventId,
} from "./HeaderEventCard";

type HeaderEvent = {
  id: HeaderEventCardEventId;
  label: string;
};

type HeaderEventCardListProps = {
  activeEventId?: HeaderEventCardEventId;
};

const events: readonly HeaderEvent[] = [
  { id: "valleyball", label: "バレー" },
  { id: "relay", label: "リレー" },
  { id: "badminton", label: "バド" },
  { id: "softtennis", label: "テニス" },
  { id: "softball", label: "ソフト" },
  { id: "scavengerhunt", label: "借人" },
  { id: "basketball", label: "バスケ" },
];

const HeaderEventCardList = ({
  activeEventId = "valleyball",
}: HeaderEventCardListProps) => {
  return (
    <nav aria-label="種目">
      <ul className="flex w-full items-start gap-2 overflow-x-auto overflow-y-hidden">
        {events.map((event) => (
          <li key={event.id} className="shrink-0">
            <HeaderEventCard
              eventId={event.id}
              label={event.label}
              isActive={event.id === activeEventId}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default HeaderEventCardList;
