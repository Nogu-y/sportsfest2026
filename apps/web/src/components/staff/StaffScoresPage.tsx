"use client";

import { useMemo, useState } from "react";
import { useSportsFestData } from "../../hooks/useSportsFestData";

type TeamTotal = {
  teamId: number;
  teamName: string;
  totalPoints: number;
  details: Array<{
    scoreId: number;
    eventId: number;
    eventName: string;
    points: number;
    reason: string;
  }>;
};

export function StaffScoresPage() {
  const { isLoading, isError, teams, events, scores } = useSportsFestData();
  const [selectedTeamId, setSelectedTeamId] = useState<number | "all">("all");

  const eventNameMap = useMemo(() => {
    return new Map(events.map((event) => [event.id, event.name]));
  }, [events]);

  const teamTotals = useMemo((): TeamTotal[] => {
    const byTeam = new Map<number, TeamTotal>();

    for (const score of scores) {
      const team = teams.find((item) => item.id === score.teamId);
      if (!team) {
        continue;
      }

      const current = byTeam.get(score.teamId) ?? {
        teamId: score.teamId,
        teamName: team.name,
        totalPoints: 0,
        details: [],
      };

      current.totalPoints += score.points;
      current.details.push({
        scoreId: score.id,
        eventId: score.eventId,
        eventName: eventNameMap.get(score.eventId) ?? `種目${score.eventId}`,
        points: score.points,
        reason: score.reason ?? "理由未設定",
      });

      byTeam.set(score.teamId, current);
    }

    return [...byTeam.values()]
      .map((teamTotal) => ({
        ...teamTotal,
        details: [...teamTotal.details].sort((left, right) => right.scoreId - left.scoreId),
      }))
      .sort((left, right) => {
        if (left.totalPoints !== right.totalPoints) {
          return right.totalPoints - left.totalPoints;
        }
        return left.teamName.localeCompare(right.teamName, "ja");
      });
  }, [eventNameMap, scores, teams]);

  const filteredHistories = useMemo(() => {
    if (selectedTeamId === "all") {
      return teamTotals;
    }

    return teamTotals.filter((teamTotal) => teamTotal.teamId === selectedTeamId);
  }, [selectedTeamId, teamTotals]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#F4F8FB] px-8 py-8">
        <div className="mx-auto max-w-[1200px] rounded-[18px] border border-[#D9E6F0] bg-white px-6 py-10 text-center text-[#5C7FA3]">
          得点データを読み込んでいます...
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-[#F4F8FB] px-8 py-8">
        <div className="mx-auto max-w-[1200px] rounded-[18px] border border-[#E7C4C4] bg-white px-6 py-10 text-center text-[#A04E4E]">
          得点データの取得に失敗しました。
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F8FB] px-8 py-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <section className="rounded-[18px] border border-[#D9E6F0] bg-white px-6 py-5">
          <h1 className="text-[22px] font-semibold text-[#2D5378]">得点表示パネル</h1>
          <p className="mt-1 text-sm text-[#7A96B0]">
            チーム合計点と、得点の積算履歴を確認できます。
          </p>
        </section>

        <section className="rounded-[18px] border border-[#D9E6F0] bg-white px-6 py-5">
          <h2 className="text-[18px] font-semibold text-[#2D5378]">チーム別合計点</h2>
          {teamTotals.length === 0 ? (
            <p className="mt-3 text-sm text-[#7A96B0]">まだ得点データがありません。</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2ECF4] text-left text-[#6D88A3]">
                    <th className="px-3 py-2">順位</th>
                    <th className="px-3 py-2">チーム</th>
                    <th className="px-3 py-2 text-right">合計点</th>
                  </tr>
                </thead>
                <tbody>
                  {teamTotals.map((teamTotal, index) => (
                    <tr key={teamTotal.teamId} className="border-b border-[#EEF4F8] text-[#355B80]">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{teamTotal.teamName}</td>
                      <td className="px-3 py-2 text-right font-semibold">{teamTotal.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-[18px] border border-[#D9E6F0] bg-white px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[18px] font-semibold text-[#2D5378]">得点積算履歴</h2>
            <select
              value={selectedTeamId}
              onChange={(event) =>
                setSelectedTeamId(event.target.value === "all" ? "all" : Number(event.target.value))
              }
              className="rounded-[10px] border border-[#C9D9E7] bg-white px-3 py-2 text-sm text-[#355B80]"
            >
              <option value="all">全チーム</option>
              {teamTotals.map((teamTotal) => (
                <option key={teamTotal.teamId} value={teamTotal.teamId}>
                  {teamTotal.teamName}
                </option>
              ))}
            </select>
          </div>

          {filteredHistories.length === 0 ? (
            <p className="mt-3 text-sm text-[#7A96B0]">表示できる履歴がありません。</p>
          ) : (
            <div className="mt-4 flex flex-col gap-4">
              {filteredHistories.map((teamTotal) => (
                <div key={teamTotal.teamId} className="rounded-[12px] border border-[#E2ECF4]">
                  <div className="flex items-center justify-between bg-[#F8FBFD] px-4 py-3">
                    <p className="text-sm font-semibold text-[#355B80]">{teamTotal.teamName}</p>
                    <p className="text-sm font-semibold text-[#4978A6]">合計: {teamTotal.totalPoints} 点</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#EEF4F8] text-left text-[#6D88A3]">
                          <th className="px-3 py-2">種目</th>
                          <th className="px-3 py-2">加点理由</th>
                          <th className="px-3 py-2 text-right">点数</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamTotal.details.map((detail) => (
                          <tr key={detail.scoreId} className="border-b border-[#F1F6FA] text-[#355B80]">
                            <td className="px-3 py-2">{detail.eventName}</td>
                            <td className="px-3 py-2">{detail.reason}</td>
                            <td className="px-3 py-2 text-right">{detail.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

