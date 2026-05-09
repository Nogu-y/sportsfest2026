import Image from "next/image";

export default function WatchlistIcon({size, fill = false}: {size: number, fill?: boolean }) {
    return (
        <Image
            src={fill ? "/icons/watchlist-on-icon.svg": "/icons/watchlist-off-icon.svg"}
            alt="ウォッチリストのアイコン"
            width={size}
            height={size}
            aria-hidden="true"
        />
    )
}