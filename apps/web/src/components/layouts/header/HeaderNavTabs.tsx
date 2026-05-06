import Link from "next/link";

type HeaderNavTab = {
  label: string;
  href: string;
};

type HeaderNavTabsProps = {
  tabs: readonly HeaderNavTab[];
  activeIndex?: number;
};

const HeaderNavTabs = ({ tabs, activeIndex = 0 }: HeaderNavTabsProps) => {
  return (
    <nav aria-label="メインナビゲーション">
      <ul className="flex w-full items-start gap-4 overflow-hidden">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;

          return (
            <li key={tab.label} className="flex flex-col items-center">
              <Link
                href={tab.href}
                className={`whitespace-nowrap text-[10px] leading-normal ${
                  isActive ? "text-white" : "text-white/50"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
              {isActive && (
                <span
                  className="mt-0.5 h-px w-7.25 bg-white"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default HeaderNavTabs;
