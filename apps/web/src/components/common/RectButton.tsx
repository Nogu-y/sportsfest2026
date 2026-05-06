type RectButtonOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type RectButtonProps<TValue extends string> = {
  option: RectButtonOption<TValue>;
  isActive: boolean;
  onClick?: (value: TValue) => void;
};

const RectButton = <TValue extends string>({
  option,
  isActive,
  onClick,
}: RectButtonProps<TValue>) => {
  return (
    <button
      type="button"
      className={`shrink-0 rounded px-2 py-1 text-[10px] leading-normal cursor-pointer transition-all transition-duration-150 ${
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

export default RectButton;
export type { RectButtonOption, RectButtonProps };
