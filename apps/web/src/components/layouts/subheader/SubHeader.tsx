import React from "react";

const SubHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <menu className="relative flex w-full flex-col gap-4 bg-primary px-8 pb-4 text-white mt-0">
      {children}
    </menu>
  );
};

export default SubHeader;
