import MatchCard from "./MatchCard";
import {MatchWithEventIdType} from "../../types/SportsFestDataTypes";

export const MatchCardList = ({matches, horizontal = false}: {
    matches: MatchWithEventIdType[]
    horizontal?: boolean,
}) => {
    return (
        <div className={`flex gap-2 scrollbar-none ${horizontal? "flex-row overflow-y-hidden": "flex-col overflow-x-hidden"}`}>
            {
                matches.map((match: MatchWithEventIdType) => <MatchCard match={match} key={match.id}/>)
            }
        </div>
    )
}
