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

type ValidationIssue = {
  message: string;
  path: Array<string | number>;
};

type ValidationError = {
  issues: ValidationIssue[];
};

type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: ValidationError };

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
  const participantKeys = [...participantKeySet];

  const validate = (values: StaffResultFormValues): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    if (expectsWinner && !participantKeySet.has(values.winnerParticipantId)) {
      issues.push({
        message: "勝者を選択してください",
        path: ["winnerParticipantId"],
      });
    }

    for (const participantId of participantKeys) {
      if (options.mode === "score") {
        const scoreRaw = values.scores[participantId] ?? "";
        const score = parseInteger(scoreRaw);

        if (scoreRaw.trim().length === 0 || Number.isNaN(score) || score < 0) {
          issues.push({
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
          issues.push({
            message: `1 から ${options.participantIds.length} の整数で入力してください`,
            path: ["ranks", participantId],
          });
        }
      }
    }

    if (expectsWinner) {
      const winnerKey = values.winnerParticipantId;
      const loserKey = participantKeys.find((participantId) => participantId !== winnerKey);

      if (winnerKey && loserKey) {
        const winnerScore = parseInteger(values.scores[winnerKey] ?? "");
        const loserScore = parseInteger(values.scores[loserKey] ?? "");

        if (
          !Number.isNaN(winnerScore) &&
          !Number.isNaN(loserScore) &&
          winnerScore <= loserScore
        ) {
          issues.push({
            message: "勝者のスコアは相手より大きくしてください",
            path: ["winnerParticipantId"],
          });
        }
      }
    }

    if (expectsRanks) {
      const ranks = participantKeys.map((participantId) =>
        parseInteger(values.ranks[participantId] ?? ""),
      );
      const validRanks = ranks.filter((rank) => !Number.isNaN(rank));

      if (new Set(validRanks).size !== validRanks.length) {
        issues.push({
          message: "着順は重複できません",
          path: ["ranks"],
        });
      }
    }

    return issues;
  };

  return {
    safeParse(values: StaffResultFormValues): SafeParseResult<StaffResultFormValues> {
      const issues = validate(values);
      if (issues.length > 0) {
        return {
          success: false,
          error: { issues },
        };
      }
      return {
        success: true,
        data: values,
      };
    },
    parse(values: StaffResultFormValues) {
      const parsed = this.safeParse(values);
      if (!parsed.success) {
        throw parsed.error;
      }
      return parsed.data;
    },
  };
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
