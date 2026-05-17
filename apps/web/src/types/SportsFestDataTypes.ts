import {MatchType} from "../../../api/src/schemas/sportsData";

export interface MatchWithEventIdType extends MatchType {
    eventId: number;
}