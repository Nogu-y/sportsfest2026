import RectButton from "./RectButton";

type RectButtonOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type RectButtonListProps<TValue extends string> = {
  options: readonly RectButtonOption<TValue>[];
  value: TValue;
  onChange?: (value: TValue) => void;
};

const RectButtonList = <TValue extends string>({
  options,
  value,
  onChange,
}: RectButtonListProps<TValue>) => {
  return (
    <div className="flex items-start gap-2 overflow-hidden">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <RectButton
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

export default RectButtonList;
export type { RectButtonListProps, RectButtonOption };
