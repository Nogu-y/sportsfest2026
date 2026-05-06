"use client";

import Link from "next/link";
import EventStatusFilter from "src/components/common/RectButtonList";
import SortOrderRadioGroup from "src/components/common/RadioGroup";
import Header from "src/components/layouts/header/Header";

const eventStatusOptions = [
  { label: "開催予定", value: "upcoming" },
  { label: "開催中", value: "ongoing" },
  { label: "結果", value: "result" },
] as const;

const sortOrderOptions = [
  { label: "開始順", value: "startsAt" },
  { label: "終了順", value: "endsAt" },
] as const;

export default function HomePage() {
  return (
    <>
      <Header>
        <div className="grid w-full grid-cols-1 items-start">
          <div className="col-start-1 row-start-1">
            <EventStatusFilter options={eventStatusOptions} value="ongoing" />
          </div>

          <div className="col-start-1 row-start-1 mt-10">
            <SortOrderRadioGroup
              name="header-sort-order"
              options={sortOrderOptions}
              value="startsAt"
            />
          </div>
        </div>
      </Header>
      <main className="p-6">
        <Link href={"/sample"}>sample</Link>
      </main>
    </>
  );
}
