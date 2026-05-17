import React from "react";
import EventRulePopup from "./EventRulePopup";

const EventHero = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="h-36 w-full bg-gray-500 flex justify-center items-center relative">
      <h2 className="text-white text-2xl font-bold">{children}</h2>
      <EventRulePopup ruleId="sample" />
    </section>
  );
};

export default EventHero;
