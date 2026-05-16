import { useCallback, useEffect, useRef, useState } from "react";
import EventRuleMarkdown from "../layouts/eventHero/EventRuleMarkdown";

const Overview = ({ eventName }: { eventName: string }) => {
  const basePath = "event-description";
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("idle");
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadedDescriptionIdRef = useRef<string | null>(null);

  const loadDescription = useCallback(async () => {
    if (status === "loading" || loadedDescriptionIdRef.current === eventName) {
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    loadedDescriptionIdRef.current = eventName;
    setStatus("loading");
    setContent("");

    try {
      const response = await fetch(
        `/event-description/${encodeURIComponent(eventName)}.md`,
        {
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load rule markdown.");
      }

      setContent(await response.text());
      setStatus("success");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setStatus("error");
    }
  }, [eventName, status]);

  useEffect(() => {
    loadDescription();
  }, []);

  return (
    <div className="text-center">
      {status === "success" && (
        <EventRuleMarkdown content={content} basePath={basePath} />
      )}
    </div>
  );
};

export default Overview;
