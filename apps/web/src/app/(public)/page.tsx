"use client";

import Link from "next/link";
import MatchCard from "src/components/common/MatchCard";
import RadioGroup from "src/components/common/RadioGroup";
import RectButtonList from "src/components/common/RectButtonList";
import { useState } from "react";
import SubHeader from "src/components/layouts/subheader/SubHeader";

const eventStatusOptions = [
  { label: "開催予定", value: "upcoming" },
  { label: "開催中", value: "ongoing" },
  { label: "結果", value: "result" },
] as const;
type EventStatusValue = (typeof eventStatusOptions)[number]["value"]; // [number]でその配列の任意のインデックスのUnion型を得られる.

const sortOrderOptions = [
  { label: "開始順", value: "startsAt" },
  { label: "終了順", value: "endsAt" },
] as const;
type SortOrderValue = (typeof sortOrderOptions)[number]["value"];

export default function HomePage() {
  const [eventStatus, setEventStatus] = useState<EventStatusValue>("ongoing");
  const [sortOrder, setSortOrder] = useState<SortOrderValue>("startsAt");

  return (
    <>
      <SubHeader>
        <div className="grid w-full grid-cols-1 items-start">
          <div className="col-start-1 row-start-1">
            <RectButtonList
              options={eventStatusOptions}
              value={eventStatus}
              onChange={(value) => setEventStatus(value)}
            />
          </div>

          <div className="col-start-1 row-start-1 mt-10">
            <RadioGroup
              name="header-sort-order"
              options={sortOrderOptions}
              value={sortOrder}
              onChange={(value) => setSortOrder(value)}
            />
          </div>
        </div>
      </SubHeader>

      <main className="space-y-4 p-6">
        <h2 className="text-primary font-bold text-lg">開催中の競技</h2>
        <MatchCard
          eventId="valleyball"
          eventName="バレーボール"
          matchName="5J vs 4J"
          dayLabel="Day1"
          timeLabel="10:20~"
          venueLabel="第一体育館 A1"
          statusLabel="試合中"
          progress={32}
        />
        
        {/*<Link href={"/sample"}>sample</Link>*/}
        
        
        
      </main>
    </>
  );
}
