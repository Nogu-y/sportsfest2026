type Option<TValue extends string> = {
  label: string;
  value: TValue;
};

type RadioGroupProps<TValue extends string> = {
  name: string;
  options: readonly Option<TValue>[];
  value: TValue;
  onChange?: (value: TValue) => void;
};

const RadioGroup = <TValue extends string>({
  name,
  options,
  value,
  onChange,
}: RadioGroupProps<TValue>) => {
  return (
    <div className="flex w-91.25 items-start gap-7 overflow-hidden">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <label
            key={option.value}
            className={`flex shrink-0 cursor-pointer items-center gap-1 text-[10px] leading-normal ${
              isActive ? "text-white" : "text-white/50"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={isActive}
              className="sr-only"
              onChange={() => onChange?.(option.value)}
            />
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isActive ? "bg-white" : "border border-primary-lite"
              }`}
              aria-hidden="true"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
};

export default RadioGroup;
export type { Option, RadioGroupProps };
