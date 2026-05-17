"use client";

import MatchCard from "src/components/common/MatchCard";
import RadioGroup from "src/components/common/RadioGroup";
import RectButtonList from "src/components/common/RectButtonList";
import {useState} from "react";
import SubHeader from "src/components/layouts/subheader/SubHeader";
import {useSportsFestData} from "../../hooks/useSportsFestData";
import {MatchCardList} from "../../components/common/MatchCardList";

const eventStatusOptions = [
    {label: "開催予定", value: "upcoming"},
    {label: "開催中", value: "ongoing"},
    {label: "結果", value: "result"},
] as const;
type EventStatusValue = (typeof eventStatusOptions)[number]["value"]; // [number]でその配列の任意のインデックスのUnion型を得られる.

const sortOrderOptions = [
    {label: "開始順", value: "startsAt"},
    {label: "終了順", value: "endsAt"},
] as const;
type SortOrderValue = (typeof sortOrderOptions)[number]["value"];

export default function HomePage() {
    const [eventStatus, setEventStatus] = useState<EventStatusValue>("ongoing");
    const [sortOrder, setSortOrder] = useState<SortOrderValue>("startsAt");
    const d = useSportsFestData()
    if (d.isLoading) return null
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
                <MatchCardList horizontal={true} matches={d.matches} />
                <MatchCard
                    match={d.matches[0]}
                />


            </main>
        </>
    );
}
