import EventStatusButton from "./RectButton";

type EventStatusOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type EventStatusFilterProps<TValue extends string> = {
  options: readonly EventStatusOption<TValue>[];
  value: TValue;
  onChange?: (value: TValue) => void;
};

const EventStatusFilter = <TValue extends string>({
  options,
  value,
  onChange,
}: EventStatusFilterProps<TValue>) => {
  return (
    <div className="flex items-start gap-2 overflow-hidden">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <EventStatusButton
            key={option.value}
            option={option}
            isActive={isActive}
            onClick={onChange}
          />
        );
      })}
    </div>
  );
};

export default EventStatusFilter;
export type { EventStatusFilterProps, EventStatusOption };
