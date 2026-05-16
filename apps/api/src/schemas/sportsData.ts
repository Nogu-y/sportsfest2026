import {z} from "@hono/zod-openapi";
import {isoDateTimeSchema, positiveIntegerSchema} from "./common";

export const rankingOrderEnumSchema = z.enum(["ASC", "DESC"]);
export const eventFormatEnumSchema = z.enum(["TOURNAMENT", "LEAGUE_TO_TOURNAMENT", "HEATS_AND_FINAL"]);
export const blockTypeEnumSchema = z.enum(["LEAGUE", "TOURNAMENT", "CUMULATIVE", "SINGLE"]);
export const stageEnumSchema = z.enum(["FINAL", "THIRD_PLACE", "SEMIFINAL", "QUARTERFINAL", "ROUND_2", "ROUND_1", "QUALIFIER", "CONSOLATION"]);
export const matchStatusEnumSchema = z.enum(["Waiting", "Preparing", "Playing", "Finished", "Completed", "Cancelled"]);

export const pointAllocationSchema = z.object({
    MATCH: z.record(stageEnumSchema, z.record(z.string(), z.number())).optional(),
    BLOCK: z.record(stageEnumSchema, z.record(z.string(), z.number())).optional(),
});

export const systemInfoSchema = z.object({
    id: positiveIntegerSchema,
    day1: isoDateTimeSchema,
    day2: isoDateTimeSchema,
    masterVersion: z.string().max(255),
});

export const mapSchema = z.object({
    id: positiveIntegerSchema,
    filePath: z.string().max(255), // APIレスポンスはキャメルケースに統一
    displayName: z.string().max(100),
    width: z.number().int(),
    height: z.number().int(),
});

export const locationSchema = z.object({
    id: positiveIntegerSchema,
    mapId: positiveIntegerSchema,
    name: z.string().max(100),
    xRatio: z.number().int().min(1).max(100),
    yRatio: z.number().int().min(1).max(100),
});


export const eventSchema = z.object({
    id: positiveIntegerSchema,
    name: z.string().max(100),
    description: z.string().nullable(),
    color: z.string().max(7).nullable(),
    ruleMd: z.string().nullable(),
    rankingOrder: rankingOrderEnumSchema,
    format: eventFormatEnumSchema,
    pointAllocation: pointAllocationSchema,
    isCompleted: z.boolean(),
});


export const teamSchema = z.object({
    id: positiveIntegerSchema,
    name: z.string()
})


export const participantSchema = z.object({
    id: positiveIntegerSchema,
    teamId: positiveIntegerSchema.nullable(),
    prereqMatchId: positiveIntegerSchema.nullable(),
    prereqBlockId: positiveIntegerSchema.nullable(),
    prereqRank: z.number().int().nullable(),
    score: z.number().int().nullable(),
    rank: z.number().int().nullable(),
    isDisqualified: z.boolean(),
});
export const matchPlanSchema = z.object({
    id: positiveIntegerSchema,
    eventBlockId: positiveIntegerSchema,
    locationId: positiveIntegerSchema.nullable(),
    name: z.string().max(100).nullable(),
    description: z.string().nullable(),
    stage: stageEnumSchema,
    status: matchStatusEnumSchema,
    scheduledStartTime: isoDateTimeSchema,
    scheduledEndTime: isoDateTimeSchema,
    startedAt: isoDateTimeSchema.nullable(),
    endedAt: isoDateTimeSchema.nullable(),
    participants: z.array(participantSchema),
    note: z.string().nullable(),
});

export const matchSchema = z.object({
    id: positiveIntegerSchema,
    eventBlockId: positiveIntegerSchema,
    locationId: positiveIntegerSchema.nullable(),
    name: z.string().nullable(),
    description: z.string().nullable(),
    stage: z.string(),
    status: z.string(),
    scheduledStartTime: isoDateTimeSchema,
    scheduledEndTime: isoDateTimeSchema,
    startedAt: isoDateTimeSchema.nullable(),
    endedAt: isoDateTimeSchema.nullable(),
    note: z.string().nullable(),
    participants: z.array(participantSchema)
})

export const blockRankingSchema = z.object({
    eventBlockId: positiveIntegerSchema,
    teamId: positiveIntegerSchema,
    rank: z.number(),
    points: z.number(),
    note: z.string().nullable()
})

export const eventBlockSchema = z.object({
    id: positiveIntegerSchema,
    eventId: positiveIntegerSchema,
    name: z.string().max(100),
    type: blockTypeEnumSchema,
    stage: stageEnumSchema,
    rankings: z.array(blockRankingSchema), // ブロック内順位をネスト
});

export const scoreSchema = z.object({
    id: positiveIntegerSchema,
    eventId: positiveIntegerSchema,
    teamId: positiveIntegerSchema,
    points: z.number().int(),
    reason: z.string().nullable(),
});