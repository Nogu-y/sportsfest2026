"use client";

import { useState, useEffect } from "react";

const clockClassName = "text-white text-[10px] font-normal text-center";

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());

    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  if (!time) {
    return <div className={`${clockClassName} invisible`}>00:00:00</div>;
  }

  const formattedTime = time.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return <div className={clockClassName}>{formattedTime}</div>;
}
