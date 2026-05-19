import { z } from "@hono/zod-openapi";
import type {
  CreateMatchResultReq,
} from "../../../api/src/schemas/staff/matches";

export type StaffResultInputMode = "score" | "rank";

export type StaffResultFormValues = {
  winnerParticipantId: string;
  scores: Record<string, string>;
  ranks: Record<string, string>;
};

type SchemaOptions = {
  participantIds: number[];
  mode: StaffResultInputMode;
};

function parseInteger(value: string) {
  return Number.parseInt(value, 10);
}

export function createDefaultStaffResultFormValues(
  participantIds: number[],
  mode: StaffResultInputMode,
) {
  const scores = Object.fromEntries(
    participantIds.map((participantId) => [String(participantId), ""]),
  );
  const ranks = Object.fromEntries(
    participantIds.map((participantId) => [String(participantId), ""]),
  );

  return {
    winnerParticipantId: "",
    scores,
    ranks: mode === "rank" ? ranks : {},
  } satisfies StaffResultFormValues;
}

export function createStaffResultSchema(options: SchemaOptions) {
  const participantKeySet = new Set(
    options.participantIds.map((participantId) => String(participantId)),
  );
  const expectsWinner = options.mode === "score" && options.participantIds.length === 2;
  const expectsRanks = options.mode === "rank" || options.participantIds.length > 2;

  return z
    .object({
      winnerParticipantId: z.string(),
      scores: z.record(z.string(), z.string()),
      ranks: z.record(z.string(), z.string()),
    })
    .superRefine((values, context) => {
      if (expectsWinner) {
        if (!participantKeySet.has(values.winnerParticipantId)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "勝者を選択してください",
            path: ["winnerParticipantId"],
          });
        }
      }

      for (const participantId of participantKeySet) {
        if (options.mode === "score") {
          const scoreRaw = values.scores[participantId] ?? "";
          const score = parseInteger(scoreRaw);

          if (scoreRaw.trim().length === 0 || Number.isNaN(score) || score < 0) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: "0以上の整数で入力してください",
              path: ["scores", participantId],
            });
          }
        }

        if (expectsRanks) {
          const rankRaw = values.ranks[participantId] ?? "";
          const rank = parseInteger(rankRaw);

          if (
            rankRaw.trim().length === 0 ||
            Number.isNaN(rank) ||
            rank < 1 ||
            rank > options.participantIds.length
          ) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: `1 から ${options.participantIds.length} の整数で入力してください`,
              path: ["ranks", participantId],
            });
          }
        }
      }

      if (expectsWinner) {
        const winnerKey = values.winnerParticipantId;
        const loserKey = [...participantKeySet].find((participantId) => participantId !== winnerKey);

        if (winnerKey && loserKey) {
          const winnerScore = parseInteger(values.scores[winnerKey] ?? "");
          const loserScore = parseInteger(values.scores[loserKey] ?? "");

          if (
            !Number.isNaN(winnerScore) &&
            !Number.isNaN(loserScore) &&
            winnerScore <= loserScore
          ) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: "勝者のスコアは相手より大きくしてください",
              path: ["winnerParticipantId"],
            });
          }
        }
      }

      if (expectsRanks) {
        const ranks = [...participantKeySet].map((participantId) =>
          parseInteger(values.ranks[participantId] ?? ""),
        );
        const validRanks = ranks.filter((rank) => !Number.isNaN(rank));

        if (new Set(validRanks).size !== validRanks.length) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "着順は重複できません",
            path: ["ranks"],
          });
        }
      }
    });
}

export function buildMatchResultPayload(
  values: StaffResultFormValues,
  options: SchemaOptions,
): CreateMatchResultReq {
  const parsed = createStaffResultSchema(options).parse(values);
  const expectsWinner = options.mode === "score" && options.participantIds.length === 2;
  const expectsRanks = options.mode === "rank" || options.participantIds.length > 2;

  return {
    participants: options.participantIds.map((participantId) => {
      const participantKey = String(participantId);
      const score =
        options.mode === "score"
          ? parseInteger(parsed.scores[participantKey] ?? "")
          : null;
      let rank: number | null = null;

      if (expectsWinner) {
        rank = parsed.winnerParticipantId === participantKey ? 1 : 2;
      } else if (expectsRanks) {
        rank = parseInteger(parsed.ranks[participantKey] ?? "");
      }

      return {
        participantId,
        score: options.mode === "score" ? score : null,
        rank,
      };
    }),
  };
}
