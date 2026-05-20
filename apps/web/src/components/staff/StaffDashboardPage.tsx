"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StaffMatchCard } from "./StaffMatchCard";
import { StaffVenueSelector } from "./StaffVenueSelector";
import { useStaffDashboard } from "../../hooks/useStaffDashboard";

export function StaffDashboardPage() {
  const {
    isLoading,
    isError,
    locationOptions,
    locationSections,
    rankableEvents,
    advancableEvents,
    scorableEvents,
    selectedLocationIds,
    showCompletedMatches,
    toggleLocation,
    setShowCompletedMatches,
    updateStatus,
    submitResult,
    finalizeEventRankings,
    resolveEventAdvancement,
    finalizeEventScore,
    getEvent,
    getMatchTeamsLabel,
    dayLabelConverter,
    getMatchError,
    isMatchPending,
    getEventScoreError,
    getEventScoreSuccessMessage,
    isEventScorePending,
    getEventRankingError,
    isEventRankingPending,
    getEventAdvanceError,
    isEventAdvancePending,
  } = useStaffDashboard();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F4F8FB] px-8 py-8">
        <div className="mx-auto max-w-[1680px] rounded-[18px] border border-[#D9E6F0] bg-white px-6 py-10 text-center text-[#5C7FA3] shadow-[0_22px_44px_rgba(28,54,80,0.08)]">
          データを読み込んでいます...
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-[#F4F8FB] px-8 py-8">
        <div className="mx-auto max-w-[1680px] rounded-[18px] border border-[#E7C4C4] bg-white px-6 py-10 text-center text-[#A04E4E] shadow-[0_22px_44px_rgba(28,54,80,0.08)]">
          試合データの取得に失敗しました。
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F8FB] px-8 py-8">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8">
        <StaffVenueSelector
          options={locationOptions}
          selectedLocationIds={selectedLocationIds}
          onToggleLocation={toggleLocation}
          showCompletedMatches={showCompletedMatches}
          onToggleCompletedMatches={setShowCompletedMatches}
        />

        <section className="rounded-[18px] border border-[#D9E6F0] bg-white px-6 py-4 shadow-[0_22px_44px_rgba(28,54,80,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[#2D5378]">得点確認</h2>
              <p className="mt-1 text-sm text-[#7A96B0]">
                チーム合計点と得点積算履歴を確認する場合は、得点表示パネルを開いてください。
              </p>
            </div>
            <Link
              href="/staff/scores"
              className="rounded-[10px] border border-[#C9D9E7] bg-[#F8FBFD] px-4 py-2 text-sm font-medium text-[#426A90] transition hover:border-[#7FA2C4] hover:bg-white"
            >
              得点表示パネルへ
            </Link>
          </div>
        </section>

        {rankableEvents.length > 0 ? (
          <section className="rounded-[18px] border border-[#D9E6F0] bg-white px-6 py-5 shadow-[0_22px_44px_rgba(28,54,80,0.08)]">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[18px] font-semibold text-[#2D5378]">予選順位確定</h2>
                <p className="mt-1 text-sm text-[#7A96B0]">
                  予選リーグの結果からブロック順位を確定します。勝ち上がり反映の前に実行してください。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {rankableEvents.map((event) => (
                  <div key={event.id} className="flex min-w-[240px] flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => finalizeEventRankings(event.id)}
                      disabled={isEventRankingPending(event.id)}
                      className="flex items-center justify-between rounded-[12px] border border-[#C9D9E7] bg-[#F8FBFD] px-4 py-3 text-left text-[#426A90] transition hover:border-[#7FA2C4] hover:bg-white disabled:cursor-wait disabled:opacity-60"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full border border-white/70"
                          style={{ backgroundColor: event.color ?? "#7FA2C4" }}
                        />
                        <span className="text-sm font-medium">{event.name}</span>
                      </span>
                      <span className="text-sm text-[#4978A6]">
                        {isEventRankingPending(event.id) ? "確定中..." : "予選順位を確定"}
                      </span>
                    </button>
                    {getEventRankingError(event.id) ? (
                      <p className="text-[13px] text-[#A04E4E]">{getEventRankingError(event.id)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {advancableEvents.length > 0 ? (
          <section className="rounded-[18px] border border-[#D9E6F0] bg-white px-6 py-5 shadow-[0_22px_44px_rgba(28,54,80,0.08)]">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[18px] font-semibold text-[#2D5378]">決勝進出反映</h2>
                <p className="mt-1 text-sm text-[#7A96B0]">
                  予選順位または前試合結果をもとに、決勝側の参加チームを反映します。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {advancableEvents.map((event) => (
                  <div key={event.id} className="flex min-w-[240px] flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => resolveEventAdvancement(event.id)}
                      disabled={isEventAdvancePending(event.id)}
                      className="flex items-center justify-between rounded-[12px] border border-[#C9D9E7] bg-[#F8FBFD] px-4 py-3 text-left text-[#426A90] transition hover:border-[#7FA2C4] hover:bg-white disabled:cursor-wait disabled:opacity-60"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full border border-white/70"
                          style={{ backgroundColor: event.color ?? "#7FA2C4" }}
                        />
                        <span className="text-sm font-medium">{event.name}</span>
                      </span>
                      <span className="text-sm text-[#4978A6]">
                        {isEventAdvancePending(event.id) ? "反映中..." : "勝ち上がり反映"}
                      </span>
                    </button>
                    {getEventAdvanceError(event.id) ? (
                      <p className="text-[13px] text-[#A04E4E]">{getEventAdvanceError(event.id)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {scorableEvents.length > 0 ? (
          <section className="rounded-[18px] border border-[#D9E6F0] bg-white px-6 py-5 shadow-[0_22px_44px_rgba(28,54,80,0.08)]">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[18px] font-semibold text-[#2D5378]">得点計算</h2>
                <p className="mt-1 text-sm text-[#7A96B0]">
                  全試合が終了した種目だけ得点計算を開始できます。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {scorableEvents.map((event) => (
                  <div key={event.id} className="flex min-w-[240px] flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => finalizeEventScore(event.id)}
                      disabled={isEventScorePending(event.id) || event.isCompleted}
                      className="flex items-center justify-between rounded-[12px] border border-[#C9D9E7] bg-[#F8FBFD] px-4 py-3 text-left text-[#426A90] transition hover:border-[#7FA2C4] hover:bg-white disabled:cursor-wait disabled:opacity-60"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full border border-white/70"
                          style={{ backgroundColor: event.color ?? "#7FA2C4" }}
                        />
                        <span className="text-sm font-medium">{event.name}</span>
                      </span>
                      <span className="text-sm text-[#4978A6]">
                        {isEventScorePending(event.id)
                          ? "送信中..."
                          : event.isCompleted
                            ? "計算済み"
                            : "計算開始"}
                      </span>
                    </button>
                    {getEventScoreError(event.id) ? (
                      <p className="text-[13px] text-[#A04E4E]">{getEventScoreError(event.id)}</p>
                    ) : null}
                    {getEventScoreSuccessMessage(event.id) ? (
                      <p className="text-[13px] text-[#2B7A4B]">{getEventScoreSuccessMessage(event.id)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {selectedLocationIds.length === 0 ? (
          <section className="rounded-[18px] border border-dashed border-[#C7D7E6] bg-white px-6 py-16 text-center text-[#6E8BA7]">
            上部の会場ボタンを選択すると、該当会場の試合カードを表示します。
          </section>
        ) : (
          <section className="flex flex-wrap justify-center gap-8">
            {locationSections.map((section) => (
              <div
                key={section.location.id}
                className="flex w-[300px] flex-col items-center gap-4"
              >
                <h2 className="text-center text-sm font-medium text-[#5A7C9F]">
                  {section.location.name}
                </h2>

                {section.matches.length === 0 ? (
                  <div className="w-full rounded-[16px] border border-dashed border-[#C7D7E6] bg-white px-4 py-10 text-center text-sm text-[#7A96B0]">
                    表示対象の試合はありません。
                  </div>
                ) : (
                  section.matches.map((match) => {
                    const event = getEvent(match.eventId);
                    return (
                      <StaffMatchCard
                        key={match.id}
                        match={match}
                        event={event}
                        teamsLabel={getMatchTeamsLabel(match.participants)}
                        dayLabel={dayLabelConverter(new Date(match.scheduledStartTime))}
                        now={now}
                        isPending={isMatchPending(match.id)}
                        errorMessage={getMatchError(match.id)}
                        onUpdateStatus={updateStatus}
                        onSubmitResult={submitResult}
                      />
                    );
                  })
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
