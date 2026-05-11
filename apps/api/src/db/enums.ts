import { pgEnum } from "drizzle-orm/pg-core";

//=============Enums=============
export const rankingOrderEnum = pgEnum("ranking_order", ["ASC", "DESC"]);

export const blockTypeEnum = pgEnum("block_type", [
  "LEAGUE",
  "TOURNAMENT",
  "CUMULATIVE",
  "SINGLE",
]);

export const eventFormatEnum = pgEnum("event_format", [
  "TOURNAMENT",
  "LEAGUE_TO_TOURNAMENT",
  "HEATS_AND_FINAL",
]);

export const stageEnum = pgEnum("stage", [
  "FINAL",
  "THIRD_PLACE",
  "SEMIFINAL",
  "QUARTERFINAL",
  "ROUND_2",
  "ROUND_1",
  "QUALIFIER",
  "CONSOLATION",
]);

export const matchStatusEnum = pgEnum("match_status", [
  "Waiting",
  "Preparing",
  "Playing",
  "Finished",
  "Completed",
  "Cancelled",
]);

export const staffRoleEnum = pgEnum('staff_role', ['ADMIN', 'STAFF'])

//=============JSON型=============

export type PointAllocation = {
  MATCH?: Partial<Record<string, Record<string, number>>>;
  BLOCK?: Partial<Record<string, Record<string, number>>>;
};
