import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  unique,
  index,
} from "drizzle-orm/pg-core";
import {
    rankingOrderEnum,
    eventFormatEnum,
    PointAllocation,
    blockTypeEnum,
    stageEnum,
    matchStatusEnum,
    staffRoleEnum, dayEnum
} from './enums'

//=============Tables=============

export const systemInfo = pgTable("system_info", {
  id: serial("id").primaryKey(),
  day1: timestamp("day1", { withTimezone: true }).notNull(),
  day2: timestamp("day2", { withTimezone: true }).notNull(),
  masterVersion: varchar("master_version", { length: 255 }).notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const maps = pgTable("maps", {
  id: serial("id").primaryKey(),
  filePath: varchar("file_path", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(), 
  day: dayEnum("day").notNull().default("both")
});

export const locations = pgTable("locations",{
    id: serial("id").primaryKey(),
    mapId: integer("map_id")
      .notNull()
      .references(() => maps.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),

    xRatio: integer("x_ratio").notNull(),
    yRatio: integer("y_ratio").notNull(),
    day: dayEnum("day").notNull().default("both")
  },
  (t) => ({
    mapIdx: index("locations_map_idx").on(t.mapId),
  })
);

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }),
  ruleMd: text("rule_md"),
  rankingOrder: rankingOrderEnum("ranking_order").notNull(),
  format: eventFormatEnum("format").notNull(),
  pointAllocation: jsonb("point_allocation").$type<PointAllocation>().notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
});

export const eventBlocks = pgTable("event_blocks",{
    id: serial("id").primaryKey(),

    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 100 }).notNull(),

    type: blockTypeEnum("type").notNull(),
    stage: stageEnum("stage").notNull(),
  },
  (t) => ({
    eventIdx: index("event_blocks_event_idx").on(t.eventId),
  })
);

export const matchPlans = pgTable("match_plans",{
    id: serial("id").primaryKey(),

    eventBlockId: integer("event_block_id")
      .notNull()
      .references(() => eventBlocks.id, { onDelete: "cascade" }),

    locationId: integer("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),

    name: varchar("name", { length: 100 }),
    description: text("description"),

    stage: stageEnum("stage").notNull(),
    status: matchStatusEnum("status").notNull().default("Waiting"),

    scheduledStartTime: timestamp("scheduled_start_time", {
      withTimezone: true,
    }).notNull(),

    scheduledEndTime: timestamp("scheduled_end_time", {
      withTimezone: true,
    }).notNull(),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    }),

    endedAt: timestamp("ended_at", {
      withTimezone: true,
    }),

    note: text("note"),
  },
  (t) => ({
    blockIdx: index("match_plans_block_idx").on(t.eventBlockId),
    statusIdx: index("match_plans_status_idx").on(t.status),
    timeIdx: index("match_plans_start_idx").on(t.scheduledStartTime),
  })
);

export const matchParticipants = pgTable("match_participants",{
    id: serial("id").primaryKey(),

    matchPlanId: integer("match_plan_id")
      .notNull()
      .references(() => matchPlans.id, { onDelete: "cascade" }),

    teamId: integer("team_id").references(() => teams.id, {
      onDelete: "set null",
    }),

    prereqMatchId: integer("prereq_match_id").references(() => matchPlans.id, {
      onDelete: "set null",
    }),

    prereqBlockId: integer("prereq_block_id").references(() => eventBlocks.id, {
      onDelete: "set null",
    }),

    prereqRank: integer("prereq_rank"),

    score: integer("score"),
    rank: integer("rank"),

    isDisqualified: boolean("is_disqualified").notNull().default(false),
  },
  (t) => ({
    matchIdx: index("participants_match_idx").on(t.matchPlanId),
  })
);

export const blockRankings = pgTable(
  "block_rankings",
  {
    id: serial("id").primaryKey(),

    eventBlockId: integer("event_block_id")
      .notNull()
      .references(() => eventBlocks.id, { onDelete: "cascade" }),

    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    rank: integer("rank").notNull(),
    points: integer("points").notNull(),

    note: text("note"),
  },
  (t) => ({
    uniqueTeam: unique("block_team_unique").on(t.eventBlockId, t.teamId),
  })
);

export const scores = pgTable("scores",{
    id: serial("id").primaryKey(),

    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),

    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),

    points: integer("points").notNull(),
    reason: text("reason"),
  },
  (t) => ({
    teamIdx: index("scores_team_idx").on(t.teamId),
  })
);

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),

  uuid: varchar("uuid", { length: 255 }).notNull().unique(),

  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),

  expiration: timestamp("expiration", { withTimezone: true }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const watchlists = pgTable("watchlists",{
    id: serial("id").primaryKey(),

    userSubscriptionId: integer("user_subscription_id")
      .notNull()
      .references(() => userSubscriptions.id, { onDelete: "cascade" }),

    matchPlanId: integer("match_plan_id")
      .notNull()
      .references(() => matchPlans.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    uniqueWatch: unique("watch_unique").on(
      t.userSubscriptionId,
      t.matchPlanId
    ),
  })
);

export const staffAccounts = pgTable(
  'staff_accounts',
  {
    id: serial('id').primaryKey(),
    loginId: varchar('login_id', { length: 100 }).notNull().unique(),
    displayName: varchar('display_name', { length: 100 }).notNull(),
    role: staffRoleEnum('role').notNull(),
    passwordHash: text('password_hash').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', {
      withTimezone: true
    })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    roleIdx: index('staff_accounts_role_idx').on(t.role),
    activeIdx: index('staff_accounts_active_idx').on(t.isActive)
  })
)

export const staffSessions = pgTable(
  'staff_sessions',
  {
    id: serial('id').primaryKey(),
    staffAccountId: integer('staff_account_id')
      .notNull()
      .references(() => staffAccounts.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true
    }).notNull(),
    lastSeenAt: timestamp('last_seen_at', {
      withTimezone: true
    })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', {
      withTimezone: true
    })
      .notNull()
      .defaultNow()
  },
  (t) => ({
    accountIdx: index('staff_sessions_account_idx').on(t.staffAccountId),
    expiresIdx: index('staff_sessions_expires_idx').on(t.expiresAt)
  })
)
