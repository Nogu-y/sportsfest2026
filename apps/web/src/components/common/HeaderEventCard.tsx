import Image from "next/image";

type HeaderEventCardProps = {
    // DBのID (number) または 絞り込みなし ("all") を受け取る
    eventId: number | "all";
    label: string;
    isActive?: boolean;
};

// 競技名（label）から既存のアイコンファイル名を推測するヘルパー関数
const getIconSlug = (label: string) => {
    if (label.includes("バレー")) return "valleyball"; // ※元のファイル名(valleyball)を維持
    if (label.includes("リレー")) return "relay";
    if (label.includes("バド")) return "badminton";
    if (label.includes("テニス")) return "softtennis";
    if (label.includes("ソフト")) return "softball";
    if (label.includes("借り人")) return "scavengerhunt";
    if (label.includes("バスケ")) return "basketball";

    // 該当しない新規競技がDBに追加された場合のフォールバック
    return "default";
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
            className={`flex shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded px-2 py-1 min-w-[3.5rem] transition-colors ${
                isActive
                    ? "bg-white text-primary shadow-sm"
                    : "border border-white/50 text-white/70 hover:bg-white/10"
            }`}
            aria-pressed={isActive}
        >
            {eventId === "all" ? (
                // 「すべて」選択時専用のアイコンプレースホルダ（画像がない場合の代替）
                <div className={`size-8 flex items-center justify-center text-lg font-black ${isActive ? 'text-primary' : 'text-white/70'}`}>
                    全
                </div>
            ) : (
                // 競技用アイコン画像
                <div className="relative size-8">
                    <Image
                        src={`/icons/events/${getIconSlug(label)}-${iconState}-icon.svg`}
                        alt={`${label}のアイコン`}
                        fill
                        sizes="32px"
                        aria-hidden="true"
                        className="object-contain"
                    />
                </div>
            )}
            <span className="whitespace-nowrap text-[9px] font-bold leading-normal">
        {label}
      </span>
        </button>
    );
};

export default HeaderEventCard;