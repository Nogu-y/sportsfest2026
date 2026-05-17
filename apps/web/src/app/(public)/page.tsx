"use client";

import RadioGroup from "src/components/common/RadioGroup";
import RectButtonList from "src/components/common/RectButtonList";
import {useEffect, useState} from "react";
import SubHeader from "src/components/layouts/subheader/SubHeader";
import {useSportsFestData} from "../../hooks/useSportsFestData";
import {MatchCardList} from "../../components/common/MatchCardList";
import {matchStatusEnumType} from "../../../../api/src/schemas/sportsData";
import {MatchWithEventIdType} from "../../types/SportsFestDataTypes";
import {PwaNotificationPrompt} from "../../components/home/PwaNotificationPrompt";

const eventStatusOptions = [
    {label: "開催予定", value: "upcoming"},
    {label: "進行中", value: "ongoing"},
    {label: "結果", value: "result"},
] as const;
type EventStatusValue = (typeof eventStatusOptions)[number]["value"]; // [number]でその配列の任意のインデックスのUnion型を得られる.

const sortOrderOptions = [
    {label: "開始順", value: "startsAt"},
    {label: "終了順", value: "endsAt"},
] as const;
type SortOrderValue = (typeof sortOrderOptions)[number]["value"];


// eventStatusに応じて表示する試合を変更
const filterMatches = (matches: MatchWithEventIdType[], eventStatus: EventStatusValue = "ongoing", sortOrder: SortOrderValue = "startsAt") => {
    let filterStatus: matchStatusEnumType[] = [];
    switch (eventStatus) {
        case "upcoming":
            filterStatus = ["Waiting", "Preparing"]
            break;
        case "ongoing":
            filterStatus = ["Playing"]
            break;
        case "result":
            filterStatus = ["Completed", "Finished", "Cancelled"]
            break;
        default:
            filterStatus = ["Waiting", "Preparing", "Playing", "Completed", "Finished", "Cancelled"]
            break;
    }
    console.log("a", filterStatus)
    // 該当するstatusの試合だけ抽出.
    const filteredMatches = matches.filter(m => filterStatus.includes(m.status))
    let sortedMatches: MatchWithEventIdType[] = [];
    // 並べ替え.
    switch (sortOrder) {
        case "startsAt":
            sortedMatches = filteredMatches.sort((a, b) => new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime())
            break;
        case "endsAt":
            sortedMatches = filteredMatches.sort((a, b) => new Date(b.scheduledEndTime).getTime() - new Date(a.scheduledEndTime).getTime())
            break;
    }
    return sortedMatches;
}

export default function HomePage() {
    const [eventStatus, setEventStatus] = useState<EventStatusValue>("ongoing");
    const [sortOrder, setSortOrder] = useState<SortOrderValue>("startsAt");

    const sportsFestData = useSportsFestData()
    const [displayMatches, setDisplayMatches] = useState<MatchWithEventIdType[]>(filterMatches(sportsFestData.matches, eventStatus, sortOrder));

    useEffect(() => {
        setDisplayMatches(filterMatches(sportsFestData.matches, eventStatus, sortOrder))
    }, [eventStatus, sortOrder, sportsFestData.matches])

    if (sportsFestData.isLoading) return null
    return (
        <>
            <SubHeader>
                <div className="grid w-full grid-cols-1 items-start">
                    <div className="col-start-1 row-start-1">
                        <RectButtonList
                            options={eventStatusOptions}
                            value={eventStatus}
                            onChange={(value) => {
                                setEventStatus(value)
                                setDisplayMatches(filterMatches(sportsFestData.matches, eventStatus, sortOrder))
                            }}
                        />
                    </div>

                    <div className="col-start-1 row-start-1 mt-10">
                        <RadioGroup
                            name="header-sort-order"
                            options={sortOrderOptions}
                            value={sortOrder}
                            onChange={(value) => {
                                setSortOrder(value)
                                setDisplayMatches(filterMatches(sportsFestData.matches, eventStatus, sortOrder))
                            }}
                        />
                    </div>
                </div>
            </SubHeader>

            <main className="space-y-4 p-6">
                <PwaNotificationPrompt/>
                <h2 className="text-primary font-bold text-lg">{eventStatusOptions.find(o => o.value === eventStatus)?.label}の試合
                    ({displayMatches.length})</h2>
                <MatchCardList matches={displayMatches} key={sortOrder + eventStatus}/>
            </main>
        </>
    );
}
