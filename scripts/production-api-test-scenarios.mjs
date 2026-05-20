#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const API_BASE = process.env.TEST_API_BASE ?? 'https://sportsfest-api.ichinoseki.ac.jp'
const OUTPUT_DIR = process.env.TEST_OUTPUT_DIR ?? 'docs/test-output'
const SESSION_COOKIE = process.env.STAFF_COOKIE ?? ''
const LOGIN_ID = process.env.STAFF_LOGIN_ID ?? ''
const PASSWORD = process.env.STAFF_PASSWORD ?? ''

const stageOrder = {
  QUALIFIER: 1,
  ROUND_1: 2,
  ROUND_2: 3,
  QUARTERFINAL: 4,
  SEMIFINAL: 5,
  THIRD_PLACE: 6,
  FINAL: 7,
  CONSOLATION: 8
}

function parseArgs(argv) {
  const args = {
    execute: false,
    scenario: 'summary'
  }

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--execute') {
      args.execute = true
      continue
    }
    if (value === '--scenario') {
      args.scenario = argv[index + 1] ?? args.scenario
      index += 1
      continue
    }
  }

  return args
}

async function requestJson(url, init = {}) {
  const response = await fetch(url, init)
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = data?.message ?? `${response.status} ${response.statusText}`
    throw new Error(`${init.method ?? 'GET'} ${url} failed: ${message}`)
  }

  return { response, data }
}

async function getSessionCookie() {
  if (SESSION_COOKIE) return SESSION_COOKIE
  if (!LOGIN_ID || !PASSWORD) return ''

  const { response } = await requestJson(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ loginId: LOGIN_ID, password: PASSWORD })
  })

  const rawCookie = response.headers.get('set-cookie')
  if (!rawCookie) {
    throw new Error('login succeeded but Set-Cookie was not returned')
  }

  return rawCookie.split(';')[0]
}

async function staffRequest(pathname, init = {}) {
  const cookie = await getSessionCookie()
  if (!cookie) {
    throw new Error('STAFF_COOKIE or STAFF_LOGIN_ID/STAFF_PASSWORD is required for execute mode')
  }

  return requestJson(`${API_BASE}${pathname}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      cookie,
      ...(init.headers ?? {})
    }
  })
}

async function fetchPublicData() {
  const [master, live] = await Promise.all([
    requestJson(`${API_BASE}/api/public/master`).then((result) => result.data),
    requestJson(`${API_BASE}/api/public/live`).then((result) => result.data)
  ])

  return { master, live }
}

function indexMaster(master) {
  return {
    eventsById: new Map(master.events.map((event) => [event.id, event])),
    blocksById: new Map(master.blocks.map((block) => [block.id, block])),
    teamsById: new Map(master.teams.map((team) => [team.id, team])),
    locationsById: new Map(master.locations.map((location) => [location.id, location]))
  }
}

function getMatchEventId(match, indexes) {
  return indexes.blocksById.get(match.eventBlockId)?.eventId ?? null
}

function getTeamLabel(teamId, indexes) {
  if (teamId === null) return '未確定'
  return indexes.teamsById.get(teamId)?.name ?? `team:${teamId}`
}

function getParticipantLabel(participant, indexes) {
  if (participant.teamId !== null) return getTeamLabel(participant.teamId, indexes)
  if (participant.prereqMatchId !== null) {
    return `試合#${participant.prereqMatchId} ${participant.prereqRank ?? 1}位`
  }
  if (participant.prereqBlockId !== null) {
    const block = indexes.blocksById.get(participant.prereqBlockId)
    return `${block?.name ?? `block:${participant.prereqBlockId}`} ${participant.prereqRank ?? 1}位`
  }
  return '未確定'
}

function matchSortValue(match) {
  return [
    new Date(match.scheduledStartTime).getTime(),
    stageOrder[match.stage] ?? 99,
    match.id
  ]
}

function compareMatches(left, right) {
  const l = matchSortValue(left)
  const r = matchSortValue(right)
  for (let index = 0; index < l.length; index += 1) {
    if (l[index] !== r[index]) return l[index] - r[index]
  }
  return 0
}

function formatJst(value) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

function buildResultPayload(match, event) {
  const participantIds = match.participants.map((participant) => participant.id)

  if (event.rankingOrder === 'ASC') {
    return {
      participants: participantIds.map((participantId, index) => ({
        participantId,
        score: null,
        rank: index + 1
      }))
    }
  }

  if (participantIds.length === 2) {
    return {
      participants: participantIds.map((participantId, index) => ({
        participantId,
        score: index === 0 ? 10 : 5,
        rank: index + 1
      }))
    }
  }

  return {
    participants: participantIds.map((participantId, index) => ({
      participantId,
      score: participantIds.length - index,
      rank: index + 1
    }))
  }
}

function isReady(match) {
  return match.participants.length > 0 && match.participants.every((participant) => participant.teamId !== null)
}

function summarize(master, live) {
  const indexes = indexMaster(master)
  const rows = master.events.map((event) => {
    const blocks = master.blocks.filter((block) => block.eventId === event.id)
    const matches = master.matches.filter((match) => getMatchEventId(match, indexes) === event.id)
    const readyMatches = matches.filter(isReady)
    const unresolvedMatches = matches.filter((match) => !isReady(match))
    const locations = [...new Set(matches.map((match) => indexes.locationsById.get(match.locationId)?.name ?? '会場なし'))]

    return {
      id: event.id,
      name: event.name,
      format: event.format,
      rankingOrder: event.rankingOrder,
      blocks: blocks.length,
      matches: matches.length,
      readyMatches: readyMatches.length,
      unresolvedMatches: unresolvedMatches.length,
      locations
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    apiBase: API_BASE,
    masterVersion: master.systemInfo.masterVersion,
    eventCount: master.events.length,
    matchCount: master.matches.length,
    liveCounts: {
      matches: live.matches.length,
      blockRankings: live.blockRankings.length,
      scores: live.scores.length
    },
    events: rows
  }
}

function scenarioDefinitions(master) {
  const indexes = indexMaster(master)
  const byEventName = (name) => master.events.find((event) => event.name === name)

  const eventScenario = (id, title, eventName, options = {}) => {
    const event = byEventName(eventName)
    const allMatches = master.matches
      .filter((match) => getMatchEventId(match, indexes) === event.id)
      .sort(compareMatches)
    const matches = options.readyOnly ? allMatches.filter(isReady) : allMatches

    return {
      id,
      title,
      eventId: event.id,
      eventName,
      intent: options.intent,
      humanOperators: options.humanOperators,
      matches
    }
  }

  return [
    eventScenario('softball-first-round', 'ソフトボール序盤トーナメント入力', 'ソフトボール', {
      readyOnly: true,
      intent: '2会場並行で、開始・終了・勝者選択・公開live反映を短時間で確認する。',
      humanOperators: '野球グラウンド A / B に1人ずつ。最初の8試合だけでも十分に煙テストになる。'
    }),
    eventScenario('basketball-qualifiers', 'バスケットボール予選リーグ入力', 'バスケットボール', {
      readyOnly: true,
      intent: 'LEAGUE_TO_TOURNAMENT の予選入力、予選順位確定、勝ち上がり反映を確認する。',
      humanOperators: '第一体育館A/B、第二体育館C/Dに各1人。予選ブロックを分担する。'
    }),
    eventScenario('badminton-qualifiers', 'バドミントン予選リーグ入力', 'バドミントン', {
      readyOnly: true,
      intent: '4人リーグの入力量が多いケースで、複数人同時操作と順位確定を確認する。',
      humanOperators: '第一体育館1-5に各1人。全30試合を会場ごとに処理する。'
    }),
    eventScenario('relay-placement', '選抜リレー順位入力', '選抜リレー', {
      readyOnly: true,
      intent: 'rankingOrder=ASC の順位入力画面を確認する。CUMULATIVE ブロックのため、現行APIでは予選順位確定・勝ち上がり反映の主検証には使わない。',
      humanOperators: '陸上グラウンド担当1人。予選5試合の順位入力までを確認する。'
    }),
    eventScenario('scavengerhunt-placement', '借り人競争順位入力', '借り人競争', {
      readyOnly: true,
      intent: '順位のみ入力のもう一つの競技で、同じ入力処理がイベントをまたいで動くか確認する。CUMULATIVE ブロックのため、現行APIでは予選順位確定・勝ち上がり反映の主検証には使わない。',
      humanOperators: '陸上グラウンド担当1人。選抜リレーとは時間をずらし、予選5試合の順位入力までを確認する。'
    })
  ]
}

function buildMarkdown(summary, scenarios, indexes) {
  const lines = [
    '# 本番API テスト入力シナリオ',
    '',
    `生成日時: ${summary.generatedAt}`,
    `API: ${summary.apiBase}`,
    `masterVersion: ${summary.masterVersion}`,
    '',
    '## 現状',
    '',
    `- 競技: ${summary.eventCount}`,
    `- 試合: ${summary.matchCount}`,
    `- live.matches: ${summary.liveCounts.matches}`,
    `- live.blockRankings: ${summary.liveCounts.blockRankings}`,
    `- live.scores: ${summary.liveCounts.scores}`,
    '',
    '## 競技別サマリ',
    '',
    '| ID | 競技 | 形式 | 順位方向 | 試合 | すぐ入力可 | 未確定枠あり | 主な会場 |',
    '| --- | --- | --- | --- | ---: | ---: | ---: | --- |'
  ]

  for (const event of summary.events) {
    lines.push(`| ${event.id} | ${event.name} | ${event.format} | ${event.rankingOrder} | ${event.matches} | ${event.readyMatches} | ${event.unresolvedMatches} | ${event.locations.join(' / ')} |`)
  }

  lines.push('', '## 推奨シナリオ', '')
  lines.push(
    '注意: 借り人競争・選抜リレーの予選ブロックは CUMULATIVE です。現行の予選順位確定APIは LEAGUE ブロックを対象にしているため、この2競技は順位入力UIの確認に使い、勝ち上がり反映の主検証はバスケットボールまたはバドミントンで行います。',
    ''
  )

  for (const scenario of scenarios) {
    lines.push(`### ${scenario.id}: ${scenario.title}`, '')
    lines.push(`- 対象: ${scenario.eventName} (#${scenario.eventId})`)
    lines.push(`- 目的: ${scenario.intent}`)
    lines.push(`- 人員: ${scenario.humanOperators}`)
    lines.push(`- 対象試合数: ${scenario.matches.length}`)
    lines.push('')
    lines.push('| matchId | 時刻 | 会場 | 試合 | stage | 参加者 | API投入時の既定結果 |')
    lines.push('| ---: | --- | --- | --- | --- | --- | --- |')

    for (const match of scenario.matches) {
      const event = indexes.eventsById.get(scenario.eventId)
      const location = indexes.locationsById.get(match.locationId)?.name ?? '-'
      const participants = match.participants.map((participant) => getParticipantLabel(participant, indexes)).join(' vs ')
      const payload = buildResultPayload(match, event)
      const result = payload.participants
        .map((participant, index) => `${getParticipantLabel(match.participants[index], indexes)}:${participant.score ?? '-'} / ${participant.rank}位`)
        .join(', ')
      lines.push(`| ${match.id} | ${formatJst(match.scheduledStartTime)} | ${location} | ${match.name ?? '-'} | ${match.stage} | ${participants} | ${result} |`)
    }

    lines.push('')
  }

  lines.push(
    '## APIスクリプト実行',
    '',
    'デフォルトは公開APIの読み取りとファイル生成だけです。',
    '',
    '```powershell',
    'node scripts/production-api-test-scenarios.mjs',
    '```',
    '',
    '認証済みCookieを使って特定シナリオを投入する場合:',
    '',
    '```powershell',
    '$env:STAFF_COOKIE="sportsfest_session=..."',
    'node scripts/production-api-test-scenarios.mjs --scenario softball-first-round --execute',
    '```',
    '',
    'ログインID/パスワードからCookieを取得して投入する場合:',
    '',
    '```powershell',
    '$env:STAFF_LOGIN_ID="..."',
    '$env:STAFF_PASSWORD="..."',
    'node scripts/production-api-test-scenarios.mjs --scenario softball-first-round --execute',
    '```',
    ''
  )

  return lines.join('\n')
}

async function writeOutputs(summary, scenarios, markdown) {
  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(path.join(OUTPUT_DIR, 'production-api-summary.json'), JSON.stringify(summary, null, 2), 'utf8')
  await writeFile(path.join(OUTPUT_DIR, 'production-api-scenarios.json'), JSON.stringify(scenarios.map((scenario) => ({
    ...scenario,
    matches: scenario.matches.map((match) => ({
      id: match.id,
      eventBlockId: match.eventBlockId,
      locationId: match.locationId,
      name: match.name,
      stage: match.stage,
      status: match.status,
      scheduledStartTime: match.scheduledStartTime,
      participants: match.participants
    }))
  })), null, 2), 'utf8')
  await writeFile(path.join(OUTPUT_DIR, 'production-api-test-plan.md'), markdown, 'utf8')
}

async function executeScenario(master, scenario) {
  const indexes = indexMaster(master)
  const event = indexes.eventsById.get(scenario.eventId)
  const executableMatches = scenario.matches.filter(isReady)

  for (const match of executableMatches) {
    const payload = buildResultPayload(match, event)
    await staffRequest(`/api/staff/matches/${match.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Playing' })
    })
    await staffRequest(`/api/staff/matches/${match.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Finished' })
    })
    await staffRequest(`/api/staff/matches/${match.id}/result`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    console.log(`completed match #${match.id} ${event.name} ${match.name ?? ''}`)
  }

  const hasLeagueBlocks = master.blocks.some((block) => (
    block.eventId === event.id && block.type === 'LEAGUE'
  ))

  if (hasLeagueBlocks) {
    await staffRequest(`/api/staff/events/${event.id}/rankings`, { method: 'POST' })
    console.log(`finalized rankings for event #${event.id}`)
    await staffRequest(`/api/staff/events/${event.id}/advance`, { method: 'POST' })
    console.log(`resolved advancement for event #${event.id}`)
  }
}

async function main() {
  const args = parseArgs(process.argv)
  const { master, live } = await fetchPublicData()
  const summary = summarize(master, live)
  const scenarios = scenarioDefinitions(master)
  const indexes = indexMaster(master)
  const markdown = buildMarkdown(summary, scenarios, indexes)

  await writeOutputs(summary, scenarios, markdown)

  const selected = scenarios.find((scenario) => scenario.id === args.scenario)

  console.log(`wrote ${OUTPUT_DIR}/production-api-test-plan.md`)
  console.log(`wrote ${OUTPUT_DIR}/production-api-summary.json`)
  console.log(`wrote ${OUTPUT_DIR}/production-api-scenarios.json`)

  if (args.execute) {
    if (!selected) {
      throw new Error(`unknown scenario: ${args.scenario}`)
    }
    await executeScenario(master, selected)
  } else if (args.scenario !== 'summary') {
    if (!selected) {
      throw new Error(`unknown scenario: ${args.scenario}`)
    }
    console.log(`dry-run scenario: ${selected.id} (${selected.matches.length} matches)`)
    console.log('add --execute and STAFF_COOKIE or STAFF_LOGIN_ID/STAFF_PASSWORD to mutate data')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
