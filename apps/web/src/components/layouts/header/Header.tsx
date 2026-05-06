import type { ReactNode } from "react";
import Image from "next/image";
import Clock from "./Clock";
import HeaderNavTabs from "./HeaderNavTabs";

const tabs = [
  { label: "ホーム", href: "/" },
  { label: "スケジュール", href: "/schedule" },
  { label: "各種目", href: "/events" },
  { label: "マッチ", href: "/map" },
] as const;

type HeaderProps = {
  activeTabIndex?: number;
  children?: ReactNode;
};

const Header = ({ activeTabIndex = 0, children }: HeaderProps) => {
  return (
    <header className="relative flex h-55 w-full flex-col gap-4 bg-primary px-8 py-4 text-white">
      <Clock />

      <div className="flex w-full items-center justify-between">
        <p className="whitespace-nowrap text-[18px] leading-normal">
          体育大会APP
        </p>

        <button
          type="button"
          className="flex shrink-0 flex-col items-center gap-0.5 text-white"
          aria-label="ウォッチリスト"
        >
          <Image
            src="icons/bookmark_icon.svg"
            alt=""
            width={24}
            height={24}
            aria-hidden="true"
          />
          <span className="whitespace-nowrap text-[10px] leading-normal">
            ウォッチリスト
          </span>
        </button>
      </div>

      <HeaderNavTabs tabs={tabs} activeIndex={activeTabIndex} />

      {children}
    </header>
  );
};

export default Header;
