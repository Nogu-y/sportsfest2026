"use client";

import { useState } from "react";
import Clock from "./Clock";
import HeaderNavTabs from "./HeaderNavTabs";
import Image from "next/image";
import { WatchlistModal } from "../../common/WatchlistModal"; // 作成したモーダルをインポート

const tabs = [
  { label: "ホーム", href: "/" },
  { label: "スケジュール", href: "/schedule" },
  { label: "各種目", href: "/event" },
  { label: "マップ", href: "/map" },
] as const;

const Header = () => {
  // モーダルの開閉状態を管理
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);

  return (
      <>
        <header className="relative flex h-35 w-full flex-col gap-4 bg-primary px-8 pt-4 text-white -mb-1">
          <Clock />

          <div className="flex w-full items-center justify-between">
            <p className="whitespace-nowrap text-[18px] leading-normal font-bold">
              体育大会APP
            </p>

            <button
                type="button"
                onClick={() => setIsWatchlistModalOpen(true)} 
                className="flex shrink-0 flex-col items-center gap-0.5 text-white active:scale-95 transition-transform"
                aria-label="ウォッチリストを開く"
            >
              <Image
                  src="/icons/watchlist-items-icon.svg"
                  alt="ウォッチリストのアイコン"
                  width={24}
                  height={24}
                  aria-hidden="true"
              />
              <span className="whitespace-nowrap text-[10px] leading-normal">
              ウォッチリスト
            </span>
            </button>
          </div>

          <HeaderNavTabs tabs={tabs} />
        </header>

        {/* ウォッチリストモーダル本体 */}
        <WatchlistModal
            isOpen={isWatchlistModalOpen}
            onClose={() => setIsWatchlistModalOpen(false)}
        />
      </>
  );
};

export default Header;