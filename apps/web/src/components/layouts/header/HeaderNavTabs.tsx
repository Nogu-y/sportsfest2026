"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type HeaderNavTab = {
  label: string;
  href: string;
};

type HeaderNavTabsProps = {
  tabs: readonly HeaderNavTab[];
};

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

const HeaderNavTabs = ({ tabs }: HeaderNavTabsProps) => {
  const pathname = usePathname();

  return (
    <nav aria-label="メインナビゲーション">
      <ul className="flex w-full items-start gap-4 overflow-hidden">
        {tabs.map((tab) => {
          const isActive = isActivePath(pathname, tab.href);

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
