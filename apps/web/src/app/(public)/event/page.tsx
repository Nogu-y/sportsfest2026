import Link from "next/link";
import HeaderEventCardList from "src/components/common/HeaderEventCardList";
import SubHeader from "src/components/layouts/subheader/SubHeader";

export default function Events() {
  return (
    <>
      <SubHeader>
        <HeaderEventCardList />
      </SubHeader>

      <main className="p-6">
        <Link href={"/sample"}>samplaae</Link>
      </main>
    </>
  );
}
