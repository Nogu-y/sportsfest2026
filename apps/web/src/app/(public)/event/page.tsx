import Link from "next/link";
import HeaderEventCardList from "src/components/common/HeaderEventCardList";
import MatchCard from "src/components/common/MatchCard";
import SubHeader from "src/components/layouts/subheader/SubHeader";

export default function Events() {
  return (
    <>
      <SubHeader>
        <HeaderEventCardList />
      </SubHeader>

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
        <Link href={"/sample"}>samplaae</Link>
      </main>
    </>
  );
}
