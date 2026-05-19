"use client";

import { useEffect, useState } from "react";
import { StaffMatchCard } from "./StaffMatchCard";
import { StaffVenueSelector } from "./StaffVenueSelector";
import { useStaffDashboard } from "../../hooks/useStaffDashboard";

export function StaffDashboardPage() {
  const {
    isLoading,
    isError,
    locationOptions,
    locationSections,
    selectedLocationIds,
    showCompletedMatches,
    toggleLocation,
    setShowCompletedMatches,
    updateStatus,
    submitResult,
    getEvent,
    getMatchTeamsLabel,
    dayLabelConverter,
    getMatchError,
    isMatchPending,
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
