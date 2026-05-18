import React, {ReactNode} from "react";
import EventRulePopup from "./EventRulePopup";

type EventHeroProps = {
    children: ReactNode;
};

const EventHero = ({children}: EventHeroProps) => {
    return (
        <div className="relative  flex items-center justify-center -mb-1 bg-[#2d5a8e]">
            {children}
            <EventRulePopup ruleId="sample"/>
        </div>
    );
};

export default EventHero;