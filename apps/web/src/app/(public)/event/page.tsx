import Link from "next/link";
import HeaderEventCardList from "src/components/common/HeaderEventCardList";
import EventHero from "src/components/layouts/eventHero/EventHero";
import SubHeader from "src/components/layouts/subheader/SubHeader";

export default function Events() {
  return (
    <>
      <SubHeader>
        <HeaderEventCardList />
      </SubHeader>
      <EventHero>バレーボール</EventHero>
      <main className="p-6">
        <Link href={"/sample"}>sample</Link>
      </main>
    </>
  );
}
