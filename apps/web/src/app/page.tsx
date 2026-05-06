"use client";

import Link from "next/link";
import RadioGroup from "src/components/common/RadioGroup";
import RectButtonList from "src/components/common/RectButtonList";

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
      <menu className="relative flex w-full flex-col gap-4 bg-primary px-8 pb-4 text-white mt-0">
        <div className="grid w-full grid-cols-1 items-start">
          <div className="col-start-1 row-start-1">
            <RectButtonList options={eventStatusOptions} value="ongoing" />
          </div>

          <div className="col-start-1 row-start-1 mt-10">
            <RadioGroup
              name="header-sort-order"
              options={sortOrderOptions}
              value="startsAt"
            />
          </div>
        </div>
      </menu>

      <main className="p-6">
        <Link href={"/sample"}>sample</Link>
      </main>
    </>
  );
}
