"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CreateMatchResultReq } from "../../../api/src/schemas/staff/matches";
import type { MatchWithEventIdType } from "../types/SportsFestDataTypes";
import { api } from "../lib/api/client";
import { sortMatchesByScheduledStart } from "../lib/staffMatchUtils";
import { useSportsFestData } from "./useSportsFestData";

type MatchOverride = Partial<
  Pick<
    MatchWithEventIdType,
    "status" | "startedAt" | "endedAt" | "participants" | "note"
  >
>;

type PendingAction = "status" | "result";

type LocationOption = {
  id: number;
  name: string;
};

type LocationSection = {
  location: LocationOption;
  matches: MatchWithEventIdType[];
};

type ScorableEvent = {
  id: number;
  name: string;
  color: string | null;
  isCompleted: boolean;
};

type AdvancableEvent = {
  id: number;
  name: string;
  color: string | null;
};

type RankableEvent = {
  id: number;
  name: string;
  color: string | null;
};

const STAFF_REQUEST_TIMEOUT_MS = 8000;

async function parseErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function withRequestTimeout<T>(
  promise: Promise<T>,
  fallbackMessage: string,
  timeoutMs = STAFF_REQUEST_TIMEOUT_MS,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(fallbackMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

const delay = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms)
})

export function useStaffDashboard() {
  const {
    isLoading,
    isError,
    matches: sourceMatches,
    locations,
    events,
    eventBlocks,
    blockRankings,
    getEvent,
    getLocation,
    getMatchTeamsLabel,
    dayLabelConverter,
    refreshMaster,
    refreshLive,
  } = useSportsFestData();
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [showCompletedMatches, setShowCompletedMatches] = useState(false);
  const [matchOverrides, setMatchOverrides] = useState<Record<number, MatchOverride>>({});
  const [pendingActions, setPendingActions] = useState<Record<number, PendingAction | undefined>>({});
  const [matchErrors, setMatchErrors] = useState<Record<number, string | undefined>>({});
  const [pendingEventScores, setPendingEventScores] = useState<Record<number, boolean | undefined>>(
    {},
  );
  const [eventScoreErrors, setEventScoreErrors] = useState<Record<number, string | undefined>>({});
  const [eventScoreSuccessMessages, setEventScoreSuccessMessages] = useState<Record<number, string | undefined>>({});
  const [pendingEventAdvances, setPendingEventAdvances] = useState<Record<number, boolean | undefined>>(
    {},
  );
  const [eventAdvanceErrors, setEventAdvanceErrors] = useState<Record<number, string | undefined>>({});
  const [pendingEventRankings, setPendingEventRankings] = useState<Record<number, boolean | undefined>>(
    {},
  );
  const [eventRankingErrors, setEventRankingErrors] = useState<Record<number, string | undefined>>({});

  const matches = useMemo(() => {
    return sourceMatches.map((match) => {
      const override = matchOverrides[match.id];
      if (!override) {
        return match;
      }

      return {
        ...match,
        ...override,
        participants: override.participants ?? match.participants,
      };
    });
  }, [matchOverrides, sourceMatches]);

  const locationOptions = useMemo(() => {
    const matchLocationIds = new Set(
      matches
        .map((match) => match.locationId)
        .filter((locationId): locationId is number => locationId !== null),
    );

    return locations
      .filter((location) => matchLocationIds.has(location.id))
      .map((location) => ({
        id: location.id,
        name: location.name,
      }));
  }, [locations, matches]);

  useEffect(() => {
    const validLocationIds = new Set(locationOptions.map((location) => location.id));
    setSelectedLocationIds((current) =>
      current.filter((locationId) => validLocationIds.has(locationId)),
    );
  }, [locationOptions]);

  const locationSections = useMemo((): LocationSection[] => {
    const visibleStatuses = showCompletedMatches
      ? null
      : new Set(["Waiting", "Preparing", "Playing", "Finished"]);

    return locationOptions
      .filter((location) => selectedLocationIds.includes(location.id))
      .map((location) => {
        const locationMatches = matches.filter((match) => {
          if (match.locationId !== location.id) {
            return false;
          }

          return visibleStatuses ? visibleStatuses.has(match.status) : true;
        });

        return {
          location,
          matches: sortMatchesByScheduledStart(locationMatches),
        };
      });
  }, [locationOptions, matches, selectedLocationIds, showCompletedMatches]);

  const toggleLocation = useCallback((locationId: number) => {
    setSelectedLocationIds((current) =>
      current.includes(locationId)
        ? current.filter((id) => id !== locationId)
        : [...current, locationId],
    );
  }, []);

  const setPendingAction = useCallback((matchId: number, action?: PendingAction) => {
    setPendingActions((current) => ({
      ...current,
      [matchId]: action,
    }));
  }, []);

  const clearMatchError = useCallback((matchId: number) => {
    setMatchErrors((current) => ({
      ...current,
      [matchId]: undefined,
    }));
  }, []);

  const scorableEvents = useMemo((): ScorableEvent[] => {
    const doneStatuses = new Set(["Completed", "Cancelled"]);

    return events
      .filter((event) => {
        const eventMatches = matches.filter((match) => match.eventId === event.id);
        if (eventMatches.length === 0) {
          return false;
        }

        return eventMatches.every((match) => doneStatuses.has(match.status));
      })
      .map((event) => ({
        id: event.id,
        name: event.name,
        color: event.color,
        isCompleted: event.isCompleted,
      }));
  }, [events, matches]);

  const advancableEvents = useMemo((): AdvancableEvent[] => {
    const blockRankTeamMap = new Map<string, number>();
    for (const ranking of blockRankings) {
      blockRankTeamMap.set(`${ranking.eventBlockId}:${ranking.rank}`, ranking.teamId);
    }

    const matchRankTeamMap = new Map<string, number>();
    for (const match of matches) {
      for (const participant of match.participants) {
        if (participant.teamId === null || participant.rank === null) {
          continue;
        }
        matchRankTeamMap.set(`${match.id}:${participant.rank}`, participant.teamId);
      }
    }

    return events
      .filter((event) => {
        const eventMatches = matches.filter((match) => match.eventId === event.id);
        if (eventMatches.length === 0) {
          return false;
        }

        const unresolvedDependencyParticipants = eventMatches.flatMap((match) =>
          match.participants.filter(
            (participant) =>
              participant.teamId === null &&
              (participant.prereqMatchId !== null || participant.prereqBlockId !== null),
          ),
        );

        if (unresolvedDependencyParticipants.length === 0) {
          return false;
        }

        return unresolvedDependencyParticipants.some((participant) => {
          const rank = participant.prereqRank ?? 1;

          if (participant.prereqBlockId !== null) {
            return blockRankTeamMap.has(`${participant.prereqBlockId}:${rank}`);
          }

          if (participant.prereqMatchId !== null) {
            return matchRankTeamMap.has(`${participant.prereqMatchId}:${rank}`);
          }

          return false;
        });
      })
      .map((event) => ({
        id: event.id,
        name: event.name,
        color: event.color,
      }));
  }, [blockRankings, events, matches]);

  const rankableEvents = useMemo((): RankableEvent[] => {
    return events
      .filter((event) => {
        const leagueBlockIds = eventBlocks
          ?.filter((block) => block.eventId === event.id && block.type === "LEAGUE")
          .map((block) => block.id) ?? [];

        if (leagueBlockIds.length === 0) {
          return false;
        }

        const hasUnrankedLeagueBlock = leagueBlockIds.some((blockId) =>
          !blockRankings.some((ranking) => ranking.eventBlockId === blockId),
        );

        if (!hasUnrankedLeagueBlock) {
          return false;
        }

        const eventMatches = matches.filter((match) => match.eventId === event.id);
        if (eventMatches.length === 0) {
          return false;
        }

        return eventMatches.some((match) => {
          if (match.status !== "Completed") {
            return false;
          }

          return match.participants.some(
            (participant) => participant.teamId !== null && participant.rank !== null,
          );
        });
      })
      .map((event) => ({
        id: event.id,
        name: event.name,
        color: event.color,
      }));
  }, [blockRankings, eventBlocks, events, matches]);

  const setEventScorePending = useCallback((eventId: number, isPending: boolean) => {
    setPendingEventScores((current) => ({
      ...current,
      [eventId]: isPending,
    }));
  }, []);

  const clearEventScoreError = useCallback((eventId: number) => {
    setEventScoreErrors((current) => ({
      ...current,
      [eventId]: undefined,
    }));
  }, []);

  const clearEventScoreSuccessMessage = useCallback((eventId: number) => {
    setEventScoreSuccessMessages((current) => ({
      ...current,
      [eventId]: undefined,
    }));
  }, []);

  const setEventAdvancePending = useCallback((eventId: number, isPending: boolean) => {
    setPendingEventAdvances((current) => ({
      ...current,
      [eventId]: isPending,
    }));
  }, []);

  const clearEventAdvanceError = useCallback((eventId: number) => {
    setEventAdvanceErrors((current) => ({
      ...current,
      [eventId]: undefined,
    }));
  }, []);

  const setEventRankingPending = useCallback((eventId: number, isPending: boolean) => {
    setPendingEventRankings((current) => ({
      ...current,
      [eventId]: isPending,
    }));
  }, []);

  const clearEventRankingError = useCallback((eventId: number) => {
    setEventRankingErrors((current) => ({
      ...current,
      [eventId]: undefined,
    }));
  }, []);

  const updateStatus = useCallback(
    async (matchId: number, status: MatchWithEventIdType["status"]) => {
      clearMatchError(matchId);
      setPendingAction(matchId, "status");

      try {
        const response = await withRequestTimeout(
          api.api.staff.matches[":matchId"].status.$patch({
            param: { matchId: String(matchId) },
            json: { status },
          }),
          "通信がタイムアウトしました。状態変更を再試行してください。",
        );

        if (!response.ok) {
          throw new Error(
            await parseErrorMessage(response, "試合ステータスの更新に失敗しました"),
          );
        }

        const updatedMatch = await response.json();

        setMatchOverrides((current) => ({
          ...current,
          [matchId]: {
            ...current[matchId],
            status: updatedMatch.status,
            startedAt: updatedMatch.startedAt,
            endedAt: updatedMatch.endedAt,
          },
        }));

        await refreshLive();
      } catch (error) {
        setMatchErrors((current) => ({
          ...current,
          [matchId]:
            error instanceof Error ? error.message : "試合ステータスの更新に失敗しました",
        }));
      } finally {
        setPendingAction(matchId, undefined);
      }
    },
    [clearMatchError, refreshLive, setPendingAction],
  );

  const submitResult = useCallback(
    async (matchId: number, payload: CreateMatchResultReq) => {
      clearMatchError(matchId);
      setPendingAction(matchId, "result");

      try {
        const currentMatch = matches.find((match) => match.id === matchId);
        const response = await withRequestTimeout(
          api.api.staff.matches[":matchId"].result.$post({
            param: { matchId: String(matchId) },
            json: payload,
          }),
          "通信がタイムアウトしました。結果送信を再試行してください。",
        );

        if (!response.ok) {
          throw new Error(
            await parseErrorMessage(response, "試合結果の登録に失敗しました"),
          );
        }

        const updatedMatch = await response.json();

        setMatchOverrides((current) => ({
          ...current,
          [matchId]: {
            ...current[matchId],
            status: updatedMatch.status,
            startedAt: updatedMatch.startedAt,
            endedAt: updatedMatch.endedAt,
            participants: currentMatch
              ? currentMatch.participants.map((participant) => {
                  const updatedParticipant = updatedMatch.participants.find(
                    (item) => item.id === participant.id,
                  );

                  return updatedParticipant
                    ? {
                        ...participant,
                        score: updatedParticipant.score,
                        rank: updatedParticipant.rank,
                        isDisqualified: updatedParticipant.isDisqualified,
                      }
                    : participant;
                })
              : current[matchId]?.participants,
          },
        }));

        await refreshLive();
        await delay(1000);
        await refreshMaster();
      } catch (error) {
        setMatchErrors((current) => ({
          ...current,
          [matchId]:
            error instanceof Error ? error.message : "試合結果の登録に失敗しました",
        }));
      } finally {
        setPendingAction(matchId, undefined);
      }
    },
    [clearMatchError, matches, refreshLive, refreshMaster, setPendingAction],
  );

  const finalizeEventScore = useCallback(
    async (eventId: number) => {
      clearEventScoreError(eventId);
      clearEventScoreSuccessMessage(eventId);
      setEventScorePending(eventId, true);

      try {
        const response = await withRequestTimeout(
          api.api.staff.events[":eventId"].score.$post({
            param: { eventId },
          }),
          "得点計算がタイムアウトしました。時間をおいて再試行してください。",
        );

        if (!response.ok) {
          throw new Error(
            await parseErrorMessage(response, "得点計算の開始に失敗しました"),
          );
        }

        setEventScoreSuccessMessages((current) => ({
          ...current,
          [eventId]: "得点計算に成功しました",
        }));

        await Promise.all([refreshMaster(), refreshLive()]);
      } catch (error) {
        setEventScoreErrors((current) => ({
          ...current,
          [eventId]:
            error instanceof Error ? error.message : "得点計算の開始に失敗しました",
        }));
      } finally {
        setEventScorePending(eventId, false);
      }
    },
    [clearEventScoreError, clearEventScoreSuccessMessage, refreshLive, refreshMaster, setEventScorePending],
  );

  const resolveEventAdvancement = useCallback(
    async (eventId: number) => {
      clearEventAdvanceError(eventId);
      setEventAdvancePending(eventId, true);

      try {
        const response = await withRequestTimeout(
          api.api.staff.events[":eventId"].advance.$post({
            param: { eventId },
          }),
          "勝ち上がり反映がタイムアウトしました。時間をおいて再試行してください。",
        );

        if (!response.ok) {
          throw new Error(
            await parseErrorMessage(response, "勝ち上がり反映に失敗しました"),
          );
        }

        await Promise.all([refreshMaster(), refreshLive()]);
      } catch (error) {
        setEventAdvanceErrors((current) => ({
          ...current,
          [eventId]:
            error instanceof Error ? error.message : "勝ち上がり反映に失敗しました",
        }));
      } finally {
        setEventAdvancePending(eventId, false);
      }
    },
    [clearEventAdvanceError, refreshLive, refreshMaster, setEventAdvancePending],
  );

  const finalizeEventRankings = useCallback(
    async (eventId: number) => {
      clearEventRankingError(eventId);
      setEventRankingPending(eventId, true);

      try {
        const response = await withRequestTimeout(
          api.api.staff.events[":eventId"].rankings.$post({
            param: { eventId },
          }),
          "予選順位確定がタイムアウトしました。時間をおいて再試行してください。",
        );

        if (!response.ok) {
          throw new Error(
            await parseErrorMessage(response, "予選順位の確定に失敗しました"),
          );
        }

        await Promise.all([refreshMaster(), refreshLive()]);
      } catch (error) {
        setEventRankingErrors((current) => ({
          ...current,
          [eventId]:
            error instanceof Error ? error.message : "予選順位の確定に失敗しました",
        }));
      } finally {
        setEventRankingPending(eventId, false);
      }
    },
    [clearEventRankingError, refreshLive, refreshMaster, setEventRankingPending],
  );

  return {
    isLoading,
    isError,
    locationOptions,
    locationSections,
    rankableEvents,
    advancableEvents,
    scorableEvents,
    selectedLocationIds,
    showCompletedMatches,
    matches,
    toggleLocation,
    setShowCompletedMatches,
    updateStatus,
    submitResult,
    finalizeEventRankings,
    resolveEventAdvancement,
    finalizeEventScore,
    getEvent,
    getLocation,
    getMatchTeamsLabel,
    dayLabelConverter,
    getMatchError: (matchId: number) => matchErrors[matchId],
    isMatchPending: (matchId: number) => pendingActions[matchId] !== undefined,
    getEventScoreError: (eventId: number) => eventScoreErrors[eventId],
    getEventScoreSuccessMessage: (eventId: number) => eventScoreSuccessMessages[eventId],
    isEventScorePending: (eventId: number) => pendingEventScores[eventId] === true,
    getEventRankingError: (eventId: number) => eventRankingErrors[eventId],
    isEventRankingPending: (eventId: number) => pendingEventRankings[eventId] === true,
    getEventAdvanceError: (eventId: number) => eventAdvanceErrors[eventId],
    isEventAdvancePending: (eventId: number) => pendingEventAdvances[eventId] === true,
  };
}
