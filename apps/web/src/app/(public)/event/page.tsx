"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import HeaderEventCardList from "src/components/common/HeaderEventCardList";
import MatchCard from "src/components/common/MatchCard";
import HorizonTitle from "src/components/event/HorizonTitle";
import EventHero from "src/components/layouts/eventHero/EventHero";
import EventRuleMarkdown from "src/components/layouts/eventHero/EventRuleMarkdown";
import SubHeader from "src/components/layouts/subheader/SubHeader";
import Overview from "src/components/event/Overview";

export default function Events() {
  return (
    <>
      {/*  種目セレクタ*/}
      <SubHeader>
        <HeaderEventCardList />
      </SubHeader>
      <EventHero>
        {/*TODO: 本ページ作成後, EventHeroのpropsにidを追加し, あちら側の責任で画像を取得できるようにする.*/}
        <img src="/relay.webp" />
      </EventHero>
      <main className="space-y-4 p-6">
        
        <HorizonTitle text="概要" />
        <Overview eventName="relay" />

        <HorizonTitle text="進行中" />

        <div className="flex gap-4 overflow-x-auto p-2 snap-x snap-mandatory">
          <MatchCard
            eventId="basketball"
            eventName="バスケットボール"
            matchName="5J vs 4J"
            dayLabel="Day1"
            timeLabel="10:20~"
            venueLabel="第一体育館 A1"
            statusLabel="試合中"
            progress={90}
          />
          <MatchCard
            eventId="basketball"
            eventName="ソフトボール"
            matchName="5J vs 4J"
            dayLabel="Day1"
            timeLabel="10:20~"
            venueLabel="第一体育館 A1"
            statusLabel="試合中"
            progress={90}
          />
          <MatchCard
            eventId="basketball"
            eventName="バレーボール"
            matchName="5J vs 4J"
            dayLabel="Day1"
            timeLabel="10:20~"
            venueLabel="第一体育館 A1"
            statusLabel="試合中"
            progress={90}
          />
        </div>
        <HorizonTitle text="次の試合" />
        <div className="flex gap-4 overflow-x-auto p-2 snap-x snap-mandatory">
          <MatchCard
            eventId="basketball"
            eventName="バスケットボール"
            matchName="5J vs 4J"
            dayLabel="Day1"
            timeLabel="10:20~"
            venueLabel="第一体育館 A1"
            statusLabel="試合中"
            progress={90}
          />
          <MatchCard
            eventId="basketball"
            eventName="ソフトボール"
            matchName="5J vs 4J"
            dayLabel="Day1"
            timeLabel="10:20~"
            venueLabel="第一体育館 A1"
            statusLabel="試合中"
            progress={90}
          />
          <MatchCard
            eventId="basketball"
            eventName="バレーボール"
            matchName="5J vs 4J"
            dayLabel="Day1"
            timeLabel="10:20~"
            venueLabel="第一体育館 A1"
            statusLabel="試合中"
            progress={90}
          />
        </div>
      </main>
    </>
  );
}
