"use client";

import { Fragment, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import type { PublicMasterResponse } from "../../../../api/src/schemas/public/master";
import type { CreateMatchResultReq } from "../../../../api/src/schemas/staff/matches";
import type { MatchWithEventIdType } from "../../types/SportsFestDataTypes";
import {
  buildMatchResultPayload,
  createDefaultStaffResultFormValues,
  createStaffResultSchema,
  type StaffResultFormValues,
  type StaffResultInputMode,
} from "../../lib/staffResultSchema";
import {
  formatClockTime,
  formatElapsedTime,
  formatWaitingTime,
  getDisplayDuration,
  getDisplayStatusLabel,
  getStatusTone,
  isPlacementOnlyEvent,
} from "../../lib/staffMatchUtils";

type StaffMatchCardProps = {
  match: MatchWithEventIdType;
  event?: PublicMasterResponse["events"][number];
  teamsLabel: string;
  dayLabel: string | null;
  now: Date;
  isPending: boolean;
  errorMessage?: string;
  onUpdateStatus: (matchId: number, status: MatchWithEventIdType["status"]) => Promise<void>;
  onSubmitResult: (matchId: number, payload: CreateMatchResultReq) => Promise<void>;
};

function getParticipantName(teamsLabel: string, participantIndex: number) {
  const parts = teamsLabel.split(" vs ");
  return parts[participantIndex] ?? `参加者${participantIndex + 1}`;
}

function getFormMode(
  event: PublicMasterResponse["events"][number] | undefined,
): StaffResultInputMode {
  return isPlacementOnlyEvent(event) ? "rank" : "score";
}

export function StaffMatchCard({
  match,
  event,
  teamsLabel,
  dayLabel,
  now,
  isPending,
  errorMessage,
  onUpdateStatus,
  onSubmitResult,
}: StaffMatchCardProps) {
  const formMode = getFormMode(event);
  const participantIds = useMemo(
    () => match.participants.map((participant) => participant.id),
    [match.participants],
  );
  const [formValues, setFormValues] = useState<StaffResultFormValues>(() =>
    createDefaultStaffResultFormValues(participantIds, formMode),
  );
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const participantLabels = useMemo(
    () =>
      Object.fromEntries(
        match.participants.map((participant, index) => [
          participant.id,
          getParticipantName(teamsLabel, index),
        ]),
      ) as Record<number, string>,
    [match.participants, teamsLabel],
  );

  useEffect(() => {
    const nextValues = createDefaultStaffResultFormValues(participantIds, formMode);

    for (const participant of match.participants) {
      const participantKey = String(participant.id);
      if (participant.score !== null) {
        nextValues.scores[participantKey] = String(participant.score);
      }
      if (participant.rank !== null) {
        nextValues.ranks[participantKey] = String(participant.rank);
      }
    }

    if (formMode === "score" && match.participants.length === 2) {
      const winner = match.participants.find((participant) => participant.rank === 1);
      nextValues.winnerParticipantId = winner ? String(winner.id) : "";
    }

    setFormValues(nextValues);
    setValidationMessage(null);
  }, [formMode, match.id, match.participants, participantIds]);

  const unresolvedParticipants = match.participants.some(
    (participant) => participant.teamId === null,
  );
  const tone = getStatusTone(match.status);
  const isStatusPending = isPending && match.status !== "Finished";
  const isResultPending = isPending && match.status === "Finished";
  const displayStartTime = formatClockTime(match.scheduledStartTime);
  const displayEndTime = formatClockTime(match.scheduledEndTime);
  const displayDuration = getDisplayDuration(match);
  const statusLabel = getDisplayStatusLabel(match.status);
  const waitingLabel = formatWaitingTime(match.scheduledStartTime, now);
  const playingLabel = formatElapsedTime(
    match.startedAt,
    now,
    match.scheduledStartTime,
  );

  const handleSubmitResult = async () => {
    const schema = createStaffResultSchema({
      participantIds,
      mode: formMode,
    });
    const parsed = schema.safeParse(formValues);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setValidationMessage(firstIssue?.message ?? "入力内容を確認してください");
      return;
    }

    setValidationMessage(null);

    const payload = buildMatchResultPayload(formValues, {
      participantIds,
      mode: formMode,
    });

    await onSubmitResult(match.id, payload);
  };

  const handleFormKeyDown = async (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    if (event.ctrlKey) {
      event.preventDefault();
      await handleSubmitResult();
      return;
    }

    event.preventDefault();
  };

  const renderWaitingLikeAction = (label: string) => (
    <div className="mt-4 flex items-end justify-between gap-4">
      <div
        className={`flex h-11 w-[178px] items-center justify-center rounded-[8px] ${tone.controlClass}`}
      >
        <span className={`text-[15px] leading-none ${tone.controlText}`}>待機中</span>
      </div>
      <span className={`text-[12px] ${tone.metaClass}`}>{label}</span>
    </div>
  );

  const renderPreparingAction = () => (
    <div className="mt-4 flex items-end justify-between gap-4">
      <button
        type="button"
        onClick={() => onUpdateStatus(match.id, "Playing")}
        disabled={isPending}
        className={`flex h-11 w-[178px] items-center justify-center rounded-[8px] transition ${tone.controlClass} ${
          isPending ? "opacity-60" : ""
        }`}
      >
        <span className={`text-[15px] leading-none ${tone.controlText}`}>
          {isStatusPending ? "送信中..." : "開始"}
        </span>
      </button>
      <span className={`text-[12px] ${tone.metaClass}`}>{waitingLabel}</span>
    </div>
  );

  const renderPlayingAction = () => (
    <div className="mt-4 flex items-end justify-between gap-4">
      <button
        type="button"
        onClick={() => onUpdateStatus(match.id, "Finished")}
        disabled={isPending}
        className={`flex h-11 w-[178px] items-center justify-center rounded-[8px] transition ${tone.controlClass} ${
          isPending ? "opacity-60" : ""
        }`}
      >
        <span className={`text-[15px] leading-none ${tone.controlText}`}>
          {isStatusPending ? "送信中..." : "終了"}
        </span>
      </button>
      <span className={`text-[20px] ${tone.metaClass}`}>{playingLabel}</span>
    </div>
  );

  const renderCompletedTable = () => {
    const participants = [...match.participants].sort((left, right) => {
      const leftRank = left.rank ?? Number.MAX_SAFE_INTEGER;
      const rightRank = right.rank ?? Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank;
    });

    if (formMode === "rank") {
      return (
        <div className="mt-4 overflow-hidden rounded-[10px] border border-white/25 bg-white/8">
          <div className="grid grid-cols-[58px_1fr] gap-3 border-b border-white/15 px-3 py-2 text-[12px] text-white/72">
            <span>順位</span>
            <span>所属</span>
          </div>
          <div className="divide-y divide-white/10">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="grid grid-cols-[58px_1fr] gap-3 px-3 py-2 text-[15px] text-white"
              >
                <span>{participant.rank ?? "-"}</span>
                <span>{participantLabels[participant.id] ?? "参加者未定"}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 overflow-hidden rounded-[10px] border border-white/25 bg-white/8">
        <div className="grid grid-cols-[58px_1fr_72px] gap-3 border-b border-white/15 px-3 py-2 text-[12px] text-white/72">
          <span>順位</span>
          <span>所属</span>
          <span className="text-right">{formMode === "score" ? "スコア" : "着順"}</span>
        </div>
        <div className="divide-y divide-white/10">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="grid grid-cols-[58px_1fr_72px] gap-3 px-3 py-2 text-[15px] text-white"
            >
              <span>{participant.rank ?? "-"}</span>
              <span>{participantLabels[participant.id] ?? "参加者未定"}</span>
              <span className="text-right">{participant.score ?? "-"}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFinishedForm = () => {
    if (unresolvedParticipants) {
      return (
        <div className="mt-4 rounded-[10px] border border-white/30 bg-white/10 px-4 py-3 text-[15px] text-white/84">
          勝ち上がりチームが未確定のため、結果入力を開始できません。
        </div>
      );
    }

    const showWinnerColumn = formMode === "score" && match.participants.length === 2;
    const showScoreColumn = formMode === "score";
    const showRankColumn = formMode === "rank" || match.participants.length > 2;

    if (showWinnerColumn) {
      return (
        <div className="mt-4" onKeyDown={handleFormKeyDown}>
          <div className="flex items-end gap-2">
            <div className="grid flex-1 grid-cols-[32px_56px_88px] gap-x-2 gap-y-2 text-[15px] text-white/88">
              <span className="text-[13px] text-white/74">勝者</span>
              <span className="text-[13px] text-white/74">所属</span>
              <span className="text-[13px] text-white/74">スコア</span>

              {match.participants.map((participant, index) => {
                const participantKey = String(participant.id);
                const participantName = getParticipantName(teamsLabel, index);

                return (
                  <Fragment key={participant.id}>
                    <label className="flex h-10 cursor-pointer items-center justify-center">
                      <input
                        type="radio"
                        name={`winner-${match.id}`}
                        value={participantKey}
                        checked={formValues.winnerParticipantId === participantKey}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            winnerParticipantId: event.target.value,
                          }))
                        }
                        className="h-4 w-4 accent-white"
                      />
                    </label>
                    <span className="flex h-10 items-center whitespace-nowrap text-[17px] text-white">
                      {participantName}
                    </span>
                    <label className="flex h-10 items-center">
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={formValues.scores[participantKey] ?? ""}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            scores: {
                              ...current.scores,
                              [participantKey]: event.target.value,
                            },
                          }))
                        }
                        className="h-10 w-full rounded-[8px] border border-white/60 bg-white/8 px-3 text-white outline-none transition focus:border-white focus:bg-white/12"
                      />
                    </label>
                  </Fragment>
                );
              })}
            </div>

            <div className="flex w-[72px] items-end">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSubmitResult}
                className={`flex h-11 w-full items-center justify-center rounded-[10px] ${
                  tone.controlClass
                } ${isPending ? "opacity-60" : ""}`}
              >
                {isResultPending ? "送信中..." : "確定"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4" onKeyDown={handleFormKeyDown}>
        <div
          className={`grid gap-x-3 gap-y-2 text-[15px] text-white/88 ${
            showScoreColumn ? "grid-cols-[1fr_106px_118px]" : "grid-cols-[1fr_118px]"
          }`}
        >
          <span className="text-[13px] text-white/74">所属</span>
          <span className="text-[13px] text-white/74">{showScoreColumn ? "スコア" : "着順"}</span>
          {showRankColumn && showScoreColumn ? <span className="text-[13px] text-white/74">着順</span> : null}

          {match.participants.map((participant, index) => {
            const participantKey = String(participant.id);
            const participantName = getParticipantName(teamsLabel, index);

            return (
              <Fragment key={participant.id}>
                <span className="flex h-10 items-center whitespace-nowrap text-[17px] text-white">
                  {participantName}
                </span>
                <label className="flex h-10 items-center">
                  {showScoreColumn ? (
                    <input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={formValues.scores[participantKey] ?? ""}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          scores: {
                            ...current.scores,
                            [participantKey]: event.target.value,
                          },
                        }))
                      }
                      className="h-10 w-full rounded-[8px] border border-white/60 bg-white/8 px-3 text-white outline-none transition focus:border-white focus:bg-white/12"
                    />
                  ) : (
                    <input
                      type="number"
                      min={1}
                      max={match.participants.length}
                      inputMode="numeric"
                      value={formValues.ranks[participantKey] ?? ""}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          ranks: {
                            ...current.ranks,
                            [participantKey]: event.target.value,
                          },
                        }))
                      }
                      className="h-10 w-full rounded-[8px] border border-white/60 bg-white/8 px-3 text-white outline-none transition focus:border-white focus:bg-white/12"
                    />
                  )}
                </label>
                {showRankColumn && showScoreColumn ? (
                  <label className="flex h-10 items-center">
                    <input
                      type="number"
                      min={1}
                      max={match.participants.length}
                      inputMode="numeric"
                      value={formValues.ranks[participantKey] ?? ""}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          ranks: {
                            ...current.ranks,
                            [participantKey]: event.target.value,
                          },
                        }))
                      }
                      className="h-10 w-full rounded-[8px] border border-white/60 bg-white/8 px-3 text-white outline-none transition focus:border-white focus:bg-white/12"
                    />
                  </label>
                ) : null}
              </Fragment>
            );
          })}
        </div>

        {showRankColumn ? (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSubmitResult}
              className={`flex h-11 min-w-[124px] items-center justify-center rounded-[10px] px-4 ${
                tone.controlClass
              } ${isPending ? "opacity-60" : ""}`}
            >
              {isResultPending ? "送信中..." : "確定"}
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <article
      className={`w-full rounded-[18px] px-6 py-5 transition-all hover:-translate-y-[2px] hover:shadow-[0_28px_52px_rgba(45,89,130,0.18)] ${tone.cardClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-medium">{event?.name ?? "種目未設定"}</h3>
          <p className={`mt-1 text-[14px] ${tone.subtleClass}`}>
            {match.name ?? "試合名未設定"}
          </p>
        </div>
        <div className={`flex items-center gap-2 text-[14px] ${tone.statusClass}`}>
          <span className={`h-3 w-3 rounded-full ${tone.dotClass}`} />
          <span>{statusLabel}</span>
        </div>
      </div>

      <p className="mt-4 text-[20px] font-semibold tracking-[0]">{teamsLabel}</p>

      <div className={`mt-4 flex items-baseline gap-3 text-[15px] ${tone.metaClass}`}>
        <span>{dayLabel ?? "-"}</span>
        <span>{`${displayStartTime} ~ ${displayEndTime}`}</span>
        <span className={`text-[12px] ${tone.subtleClass}`}>{displayDuration}</span>
      </div>

      {match.status === "Waiting" && renderWaitingLikeAction(waitingLabel)}
      {match.status === "Preparing" && renderPreparingAction()}
      {match.status === "Playing" && renderPlayingAction()}
      {match.status === "Finished" && renderFinishedForm()}
      {match.status === "Completed" && renderCompletedTable()}
      {match.status === "Cancelled" && renderWaitingLikeAction("中止")}

      {(validationMessage || errorMessage || isPending) && (
        <div className={`mt-3 text-[13px] ${tone.subtleClass}`}>
          {validationMessage ??
            errorMessage ??
            (isResultPending ? "結果を送信しています..." : "状態を更新しています...")}
        </div>
      )}

      <div className={`mt-4 flex items-center justify-between gap-4 text-[12px] ${tone.subtleClass}`}>
        <span>{`#${match.id}`}</span>
        {match.status === "Finished" ? (
          <span>Tabキーで切り替え, Ctrl+Enterで送信</span>
        ) : null}
      </div>
    </article>
  );
}
