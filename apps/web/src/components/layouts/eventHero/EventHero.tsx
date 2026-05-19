import React, {ReactNode} from "react";
import EventRulePopup from "./EventRulePopup";

type EventHeroProps = {
    eventId: number;
    children: ReactNode;
};

const EventHero = ({eventId, children}: EventHeroProps) => {
    return (
        <div className="relative  flex items-center justify-center -mb-1 bg-[#2d5a8e]">
            {children}
            <EventRulePopup eventId={eventId}/>
        </div>
    );
};

export default EventHero;