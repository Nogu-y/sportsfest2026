type EventStatusButtonOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type EventStatusButtonProps<TValue extends string> = {
  option: EventStatusButtonOption<TValue>;
  isActive: boolean;
  onClick?: (value: TValue) => void;
};

const EventStatusButton = <TValue extends string>({
  option,
  isActive,
  onClick,
}: EventStatusButtonProps<TValue>) => {
  return (
    <button
      type="button"
      className={`shrink-0 rounded px-2 py-1 text-[10px] leading-normal ${
        isActive
          ? "w-32 bg-white text-primary"
          : "w-16 border border-primary-lite text-white/50"
      }`}
      aria-pressed={isActive}
      onClick={() => onClick?.(option.value)}
    >
      {option.label}
    </button>
  );
};

export default EventStatusButton;
export type { EventStatusButtonOption, EventStatusButtonProps };
