import {MatchType} from "../../../../api/src/schemas/sportsData";
import MatchCard from "./MatchCard";
import {MatchWithEventIdType} from "../../types/SportsFestDataTypes";

export const MatchCardList = (matches: MatchWithEventIdType[]) => {
    return (
        <>
            {
                matches.map((match: MatchType) =>
                    (<MatchCard
                    eventId={match.}    
                    />)
                )
            }
        </>
    )
}
