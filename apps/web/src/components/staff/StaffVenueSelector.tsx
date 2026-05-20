import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";

type StaffVenueSelectorProps = {
  options: Array<{
    id: number;
    name: string;
  }>;
  selectedLocationIds: number[];
  onToggleLocation: (locationId: number) => void;
  showCompletedMatches: boolean;
  onToggleCompletedMatches: (checked: boolean) => void;
};

export function StaffVenueSelector({
  options,
  selectedLocationIds,
  onToggleLocation,
  showCompletedMatches,
  onToggleCompletedMatches,
}: StaffVenueSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const selectedSummary = useMemo(() => {
    if (selectedLocationIds.length === 0) {
      return "未選択";
    }

    const selectedNames = options
      .filter((option) => selectedLocationIds.includes(option.id))
      .map((option) => option.name);

    return selectedNames.join(", ");
  }, [options, selectedLocationIds]);

  return (
    <div className="flex flex-col gap-5 rounded-[18px] border border-[#D9E6F0] bg-white px-6 py-5 shadow-[0_22px_44px_rgba(28,54,80,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-[#2D5378]">支部用試合管理</h1>
          <p className="mt-1 text-sm text-[#7A96B0]">
            会場を選択すると、その会場の試合カードを表示します。
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 text-sm text-[#486989]">
          <input
            type="checkbox"
            checked={showCompletedMatches}
            onChange={(event) => onToggleCompletedMatches(event.target.checked)}
            className="h-4 w-4 rounded border border-[#87A7C5] text-[#4978A6] accent-[#4978A6]"
          />
          終了した試合を表示する
        </label>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-[#E2ECF4] pt-4">
        <div className="min-w-0">
          <p className="text-xs text-[#7A96B0]">選択中の会場</p>
          <p className="truncate text-sm text-[#426A90]">{selectedSummary}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          className="flex h-9 items-center gap-2 rounded-[10px] border border-[#C9D9E7] bg-[#F8FBFD] px-3 text-sm text-[#426A90] transition hover:border-[#7FA2C4] hover:bg-white"
        >
          {isExpanded ? "畳む" : "開く"}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded ? (
        <div className="flex flex-wrap justify-center gap-3">
          {options.map((option) => {
            const isSelected = selectedLocationIds.includes(option.id);

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onToggleLocation(option.id)}
                className={`min-w-[128px] rounded-[12px] border px-4 py-3 text-sm transition-all ${
                  isSelected
                    ? "border-[#4978A6] bg-[#4978A6] text-white shadow-[0_12px_24px_rgba(45,89,130,0.24)]"
                    : "border-[#C9D9E7] bg-[#F8FBFD] text-[#426A90] hover:border-[#7FA2C4] hover:bg-white"
                }`}
              >
                {option.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
