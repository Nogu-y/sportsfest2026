"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import EventRuleMarkdown from "./EventRuleMarkdown";
import Image from "next/image";

type RuleStatus = "idle" | "loading" | "success" | "error";

type EventRulePopupProps = {
  ruleId: string;
};

const EventRulePopup = ({ ruleId }: EventRulePopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<RuleStatus>("idle");
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadedRuleIdRef = useRef<string | null>(null);

  const basePath = useMemo(
    () => `/rules/${encodeURIComponent(ruleId)}`,
    [ruleId],
  );

  const loadRule = useCallback(async () => {
    if (status === "loading" || loadedRuleIdRef.current === ruleId) {
      return;
    }

    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;
    loadedRuleIdRef.current = ruleId;
    setStatus("loading");
    setContent("");

    try {
      const response = await fetch(`${basePath}/content.md`, {
        signal: controller.signal,
      });

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
  }, [basePath, ruleId, status]);

  const openPopup = () => {
    setIsOpen(true);
    void loadRule();
  };

  useEffect(() => {
    setContent("");
    setStatus("idle");
    loadedRuleIdRef.current = null;
    abortControllerRef.current?.abort();
  }, [ruleId]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <button
        className="w-8 h-10 flex flex-col items-center justify-center absolute right-6 top-6"
        onClick={openPopup}
      >
        <Image
          src="/icons/question-icon.svg"
          alt="ルールアイコン"
          width={32}
          height={32}
        />
        <span className="text-[8px] text-white mx-auto mt-1">ルール</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 px-4 py-8"
          role="presentation"
          onClick={() => setIsOpen(false)}
        >
          <section
            className="max-h-full w-full max-w-2xl overflow-hidden rounded bg-white shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label="試合ルール"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-primary-lite2 px-5 py-4">
              <h2 className="text-[18px] font-bold leading-normal text-dark">
                試合ルール
              </h2>
              <button
                type="button"
                className="rounded px-2 py-1 text-[20px] leading-none text-dark transition-colors hover:bg-primary-lite2"
                aria-label="閉じる"
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            </header>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
              {status === "loading" && (
                <p className="text-[14px] leading-7 text-dark">読み込み中...</p>
              )}
              {status === "error" && (
                <p className="text-[14px] leading-7 text-dark">
                  ルールを読み込めませんでした。
                </p>
              )}
              {status === "success" && (
                <EventRuleMarkdown content={content} basePath={basePath} />
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default EventRulePopup;
