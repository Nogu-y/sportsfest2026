import type { PublicMasterResponse } from "../../../api/src/schemas/public/master";
import type { MatchWithEventIdType } from "../types/SportsFestDataTypes";
import { formatStatusLabel } from "./matchUtils";

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

export function sortMatchesByScheduledStart(matches: MatchWithEventIdType[]) {
  return [...matches].sort((left, right) => {
    return (
      new Date(left.scheduledStartTime).getTime() -
      new Date(right.scheduledStartTime).getTime()
    );
  });
}

export function formatClockTime(dateString: string | null | undefined) {
  if (!dateString) {
    return "--:--";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export function formatMatchDuration(startAt: string, endAt: string) {
  const durationMs =
    new Date(endAt).getTime() - new Date(startAt).getTime();

  if (Number.isNaN(durationMs) || durationMs <= 0) {
    return "--";
  }

  const hours = Math.floor(durationMs / HOUR_MS);
  const minutes = Math.floor((durationMs % HOUR_MS) / MINUTE_MS);

  if (hours > 0) {
    return `${hours}時間${minutes}分`;
  }

  return `${minutes}分間`;
}

export function formatElapsedTime(
  startAt: string | null | undefined,
  now: Date,
  fallbackStartAt?: string,
) {
  const base = startAt ?? fallbackStartAt;
  if (!base) {
    return "00:00";
  }

  const startMs = new Date(base).getTime();
  const elapsedMs = Math.max(0, now.getTime() - startMs);

  if (Number.isNaN(elapsedMs)) {
    return "00:00";
  }

  const minutes = Math.floor(elapsedMs / MINUTE_MS)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor((elapsedMs % MINUTE_MS) / SECOND_MS)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export function formatWaitingTime(
  scheduledStartTime: string,
  now: Date,
  prefixIfFuture = "開始まで",
) {
  const scheduledMs = new Date(scheduledStartTime).getTime();
  const diffMs = scheduledMs - now.getTime();

  if (Number.isNaN(scheduledMs)) {
    return `${prefixIfFuture} 00:00:00`;
  }

  const label = diffMs < 0 ? "遅延" : prefixIfFuture;
  const absoluteMs = Math.abs(diffMs);
  const hours = Math.floor(absoluteMs / HOUR_MS)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((absoluteMs % HOUR_MS) / MINUTE_MS)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor((absoluteMs % MINUTE_MS) / SECOND_MS)
    .toString()
    .padStart(2, "0");

  return `${label} ${hours}:${minutes}:${seconds}`;
}

export function getDisplayEndTime(match: MatchWithEventIdType) {
  if (match.status === "Finished" || match.status === "Completed") {
    return match.endedAt ?? match.scheduledEndTime;
  }

  return match.scheduledEndTime;
}

export function getDisplayDuration(match: MatchWithEventIdType) {
  if (
    (match.status === "Finished" || match.status === "Completed") &&
    match.startedAt &&
    match.endedAt
  ) {
    return formatMatchDuration(match.startedAt, match.endedAt);
  }

  return formatMatchDuration(match.scheduledStartTime, match.scheduledEndTime);
}

export function getStatusTone(status: MatchWithEventIdType["status"]) {
  switch (status) {
    case "Waiting":
      return {
        cardClass:
          "border border-[#4A7CAD] bg-white text-[#3F6F9D] shadow-[0_18px_38px_rgba(40,72,104,0.08)]",
        statusClass: "text-[#B6B6B6]",
        dotClass: "bg-[#B6B6B6]",
        controlClass:
          "border border-[#E5EEF6] bg-[#F8FBFD] text-[#D3DCE6] cursor-not-allowed",
        controlText: "text-[#D3DCE6]",
        metaClass: "text-[#6C8EAF]",
        subtleClass: "text-[#9AB2CA]",
      };
    case "Cancelled":
      return {
        cardClass:
          "border border-[#D8E3EF] bg-white text-[#4B6682] shadow-[0_18px_38px_rgba(40,72,104,0.05)]",
        statusClass: "text-[#7F98B0]",
        dotClass: "bg-[#7F98B0]",
        controlClass:
          "border border-[#D8E3EF] bg-[#F6F9FC] text-[#9AB2CA] cursor-not-allowed",
        controlText: "text-[#9AB2CA]",
        metaClass: "text-[#6C8EAF]",
        subtleClass: "text-[#9AB2CA]",
      };
    case "Finished":
      return {
        cardClass:
          "border border-[#4678A7] bg-[#4978A6] text-white shadow-[0_24px_44px_rgba(45,89,130,0.24)]",
        statusClass: "text-white",
        dotClass: "bg-[#C8BC1B]",
        controlClass:
          "border border-white/85 bg-white text-[#4978A6] hover:bg-[#F6FAFF]",
        controlText: "text-[#4978A6]",
        metaClass: "text-white/92",
        subtleClass: "text-white/70",
      };
    case "Preparing":
      return {
        cardClass:
          "border border-[#4678A7] bg-[#4978A6] text-white shadow-[0_24px_44px_rgba(45,89,130,0.24)]",
        statusClass: "text-white",
        dotClass: "bg-[#62BF3F]",
        controlClass:
          "border border-white/85 bg-transparent text-white hover:bg-white/12",
        controlText: "text-white",
        metaClass: "text-white/92",
        subtleClass: "text-white/70",
      };
    case "Playing":
      return {
        cardClass:
          "border border-[#4678A7] bg-[#4978A6] text-white shadow-[0_24px_44px_rgba(45,89,130,0.24)]",
        statusClass: "text-white",
        dotClass: "bg-white",
        controlClass:
          "border border-white/85 bg-white text-[#4978A6] hover:bg-[#F6FAFF]",
        controlText: "text-[#4978A6]",
        metaClass: "text-white/92",
        subtleClass: "text-white/70",
      };
    case "Completed":
      return {
        cardClass:
          "border border-[#4678A7] bg-[#4978A6] text-white shadow-[0_24px_44px_rgba(45,89,130,0.24)]",
        statusClass: "text-white",
        dotClass: "bg-[#E5EEF6]",
        controlClass:
          "border border-white/85 bg-white/10 text-white/80 cursor-default",
        controlText: "text-white/80",
        metaClass: "text-white/92",
        subtleClass: "text-white/70",
      };
    default:
      return {
        cardClass:
          "border border-[#4678A7] bg-[#4978A6] text-white shadow-[0_24px_44px_rgba(45,89,130,0.24)]",
        statusClass: "text-white",
        dotClass: "bg-white",
        controlClass:
          "border border-white/85 bg-transparent text-white hover:bg-white/12",
        controlText: "text-white",
        metaClass: "text-white/92",
        subtleClass: "text-white/70",
      };
  }
}

export function getDisplayStatusLabel(status: MatchWithEventIdType["status"]) {
  return formatStatusLabel(status);
}

type StaffEvent = PublicMasterResponse["events"][number];

export function isPlacementOnlyEvent(event?: StaffEvent) {
  return event?.rankingOrder === "ASC";
}
