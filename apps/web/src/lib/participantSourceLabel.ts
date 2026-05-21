import type { ParticipantType } from "../../../api/src/schemas/sportsData"

export const resolvePrereqMatchOutcomeLabel = (
  participant: ParticipantType,
  options?: {
    winnerLabel?: string
    loserLabel?: string
    unknownWinnerLabel?: string
    unknownLoserLabel?: string
  }
) => {
  const winnerLabel = options?.winnerLabel ?? "勝者"
  const loserLabel = options?.loserLabel ?? "敗者"
  const unknownWinnerLabel = options?.unknownWinnerLabel ?? `未定の${winnerLabel}`
  const unknownLoserLabel = options?.unknownLoserLabel ?? `未定の${loserLabel}`

  const isLoserSide = participant.prereqRank === 2

  return {
    sideLabel: isLoserSide ? loserLabel : winnerLabel,
    unknownSideLabel: isLoserSide ? unknownLoserLabel : unknownWinnerLabel,
  }
}
