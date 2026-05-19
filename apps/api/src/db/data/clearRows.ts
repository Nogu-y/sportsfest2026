import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { sql } from 'drizzle-orm'
import { db } from '../client'

const TABLES_TO_CLEAR = [
  'match_reminder_logs',
  'watchlists',
  'scores',
  'block_rankings',
  'match_participants',
  'match_plans',
  'event_blocks',
  'events',
  'locations',
  'maps',
  'teams',
] as const

async function confirmOrAbort() {
  const rl = readline.createInterface({ input, output })
  try {
    const answer = await rl.question(
      '投入済みデータを削除します。実行する場合は "yes" を入力してください: '
    )

    if (answer.trim().toLowerCase() !== 'yes') {
      console.log('中断しました。データは削除していません。')
      process.exit(0)
    }
  } finally {
    rl.close()
  }
}

async function clearExistingTables() {
  const tableNameParams = TABLES_TO_CLEAR.map((name) => sql`${name}`)
  const tableNameRows = await db.execute<{ table_name: string }>(
    sql`SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (${sql.join(tableNameParams, sql`, `)})`
  )

  const existingNames = tableNameRows.map((row) => row.table_name)
  if (existingNames.length === 0) {
    console.log('削除対象テーブルが見つからなかったため、処理を終了しました。')
    return
  }

  // 取得元は information_schema のため、識別子としてそのまま連結する。
  const tableList = existingNames.map((name) => `"${name}"`).join(', ')
  await db.execute(sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`))
}

async function main() {
  await confirmOrAbort()
  await clearExistingTables()

  console.log('Rows由来データを削除しました。')
}

main().catch((error) => {
  console.error('データ削除に失敗しました')
  console.error(error)
  process.exit(1)
})
