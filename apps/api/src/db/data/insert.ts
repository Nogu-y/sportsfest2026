import { sql } from "drizzle-orm"
import { db } from "../client"
import {
  blockRankings,
  eventBlocks,
  events,
  locations,
  maps,
  matchParticipants,
  matchPlans,
  scores,
  systemInfo,
  teams,
  userSubscriptions,
  watchlists,
} from "../schema"
import { sampleData } from "./sample/data"

type IdRow = { id: number }

const sequenceTargets = [
  { sequenceName: "system_info_id_seq", rows: sampleData.systemInfo },
  { sequenceName: "teams_id_seq", rows: sampleData.teams },
  { sequenceName: "maps_id_seq", rows: sampleData.maps },
  { sequenceName: "locations_id_seq", rows: sampleData.locations },
  { sequenceName: "events_id_seq", rows: sampleData.events },
  { sequenceName: "event_blocks_id_seq", rows: sampleData.eventBlocks },
  { sequenceName: "match_plans_id_seq", rows: sampleData.matchPlans },
  { sequenceName: "match_participants_id_seq", rows: sampleData.matchParticipants },
  { sequenceName: "block_rankings_id_seq", rows: sampleData.blockRankings },
  { sequenceName: "scores_id_seq", rows: sampleData.scores },
  { sequenceName: "user_subscriptions_id_seq", rows: sampleData.userSubscriptions },
  { sequenceName: "watchlists_id_seq", rows: sampleData.watchlists },
] as const

const getMaxId = (rows: readonly IdRow[]) =>
  rows.reduce((maxId, row) => Math.max(maxId, row.id), 0)

const syncSequence = async (
  sequenceName: (typeof sequenceTargets)[number]["sequenceName"],
  rows: readonly IdRow[]
) => {
  const maxId = getMaxId(rows)
  const currentValue = maxId > 0 ? maxId : 1
  const isCalled = maxId > 0

  await db.execute(
    sql`SELECT setval(to_regclass(${sequenceName}), ${currentValue}, ${isCalled})`
  )
}

const main = async () => {
  await db.transaction(async (tx) => {
    // 参照関係をまとめて初期化し、投入後に連番を現在値へ揃える。
    await tx.execute(
      sql`TRUNCATE TABLE
        watchlists,
        user_subscriptions,
        scores,
        block_rankings,
        match_participants,
        match_plans,
        event_blocks,
        events,
        locations,
        maps,
        teams,
        system_info
        RESTART IDENTITY CASCADE`
    )

    await tx.insert(systemInfo).values(sampleData.systemInfo)
    await tx.insert(teams).values(sampleData.teams)
    await tx.insert(maps).values(sampleData.maps)
    await tx.insert(locations).values(sampleData.locations)
    await tx.insert(events).values(sampleData.events)
    await tx.insert(eventBlocks).values(sampleData.eventBlocks)
    await tx.insert(matchPlans).values(sampleData.matchPlans)
    await tx.insert(matchParticipants).values(sampleData.matchParticipants)
    await tx.insert(blockRankings).values(sampleData.blockRankings)
    await tx.insert(scores).values(sampleData.scores)
    await tx.insert(userSubscriptions).values(sampleData.userSubscriptions)
    await tx.insert(watchlists).values(sampleData.watchlists)
  })

  for (const target of sequenceTargets) {
    await syncSequence(target.sequenceName, target.rows)
  }

  console.log("Sample data inserted successfully")
}

main().catch((error) => {
  console.error("Failed to insert sample data")
  console.error(error)
  process.exit(1)
})
