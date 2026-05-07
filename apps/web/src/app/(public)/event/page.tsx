import Link from "next/link";
import HeaderEventCardList from "src/components/common/HeaderEventCardList";
import MatchCard from "src/components/common/MatchCard";
import EventHero from "src/components/layouts/eventHero/EventHero";
import SubHeader from "src/components/layouts/subheader/SubHeader";

export default function Events() {
  return (
    <>
      {/*  種目セレクタ*/}
      <SubHeader>
        <HeaderEventCardList />
      </SubHeader>
        
        <EventHero>
            {/*TODO: 本ページ作成後, EventHeroのpropsにidを追加し, あちら側の責任で画像を取得できるようにする.*/}
            選抜リレー
        </EventHero>

      <main className="space-y-4 p-6">
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
        <Link href={"/sample"}>sample</Link>
      </main>
    </>
  );
}
