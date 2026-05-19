# Staff API フロント実装向け仕様書

## 対象
本書は `/api/staff/*` をフロントエンドから利用するための実装仕様です。

## 前提
- `staff` 系APIは認証必須です
- 利用可能ロールは `ADMIN` / `STAFF` です
- APIベースURLは `NEXT_PUBLIC_API_BASE_URL` を使用します
- Webクライアントは `credentials: 'include'` でリクエストし、セッションCookieを送信してください

## 認証仕様（必読）
`/api/staff/*` へアクセスする前に `/api/auth/*` でセッションを確立します。

### 1. ログイン
- Method: `POST`
- Path: `/api/auth/login`
- Body:

```json
{
  "loginId": "string",
  "password": "string"
}
```

- Success `200`:

```json
{
  "authenticated": true,
  "account": {
    "id": 1,
    "loginId": "staff01",
    "displayName": "運営A",
    "role": "STAFF"
  },
  "expiresAt": "2026-05-19T10:00:00.000Z"
}
```

- Error:
  - `401`: ログインIDまたはパスワード不正

### 2. セッション確認
- Method: `GET`
- Path: `/api/auth/session`
- Success `200`: ログイン時と同じ形式
- Error:
  - `401`: 未認証（Cookie欠落/期限切れ/無効）

### 3. ログアウト
- Method: `POST`
- Path: `/api/auth/logout`
- Success `200`:

```json
{ "message": "ログアウトしました" }
```

## Staff API 一覧

### 1. 試合ステータス更新
- Method: `PATCH`
- Path: `/api/staff/matches/{matchId}/status`
- Body:

```json
{
  "status": "Waiting | Preparing | Playing | Finished | Completed | Cancelled"
}
```

- Success `200`:

```json
{
  "id": 10,
  "status": "Playing",
  "startedAt": "2026-05-19T09:30:00.000Z",
  "endedAt": null
}
```

- Error:
  - `401`: 未認証
  - `403`: 権限不足
  - `404`: 試合が見つからない
  - `500`: 更新失敗

#### サーバー側の自動補正ルール
- `status = Playing` のとき:
  - `startedAt` が未設定なら現在時刻を自動設定
  - `endedAt` は `null` に戻る
- `status = Finished` のとき:
  - `endedAt` が未設定なら現在時刻を自動設定
- `Completed / Cancelled` などは時刻自動補正なし

### 2. 試合結果の新規登録
- Method: `POST`
- Path: `/api/staff/matches/{matchId}/result`
- Body:

```json
{
  "participants": [
    {
      "participantId": 101,
      "score": 21,
      "rank": 1,
      "isDisqualified": false
    },
    {
      "participantId": 102,
      "score": 18,
      "rank": 2,
      "isDisqualified": false
    }
  ]
}
```

- Success `200`:

```json
{
  "id": 10,
  "status": "Completed",
  "startedAt": "2026-05-19T09:30:00.000Z",
  "endedAt": "2026-05-19T09:45:00.000Z",
  "participants": [
    {
      "id": 101,
      "teamId": 2,
      "score": 21,
      "rank": 1,
      "isDisqualified": false
    },
    {
      "id": 102,
      "teamId": 7,
      "score": 18,
      "rank": 2,
      "isDisqualified": false
    }
  ]
}
```

- Error:
  - `401`: 未認証
  - `403`: 権限不足
  - `404`: 試合が見つからない
  - `409`: 勝ち上がりチーム未確定（`teamId = null` が残っている）
  - `422`: `participantId` 不正、または同一participant重複
  - `500`: 更新失敗

#### サーバー側の挙動
- 指定した participant の `score / rank / isDisqualified` を更新
- 更新成功時は `match.status = Completed` へ更新
- `endedAt` が未設定なら現在時刻を自動設定

### 3. 試合結果の修正
- Method: `PATCH`
- Path: `/api/staff/matches/{matchId}/result`
- Body / Success / Error は `POST` と同じ
- 用途: 誤入力後の修正

### 4. 競技得点の最終確定
- Method: `POST`
- Path: `/api/staff/events/{eventId}/score`
- Body: なし

- Success `200`:

```json
{
  "eventId": 3,
  "isCompleted": true,
  "scores": [
    {
      "eventId": 3,
      "teamId": 2,
      "points": 30,
      "reason": "バスケットボール 決勝1位"
    }
  ]
}
```

- Error:
  - `401`: 未認証
  - `403`: 権限不足
  - `404`: 競技が見つからない
  - `409`: 確定に必要な試合結果/順位データ不足
  - `422`: 配点設定不正

#### 重要挙動
- 確定時に対象 `event` の既存 `scores` を一度削除し、再生成して保存します
- 正常終了時、`event.isCompleted = true` に更新されます
- 試合配点（`MATCH`）は、対象試合が `Completed` であることが前提です

## フロント実装ガイド

### リクエスト共通
- 必ず `credentials: 'include'` を付与
- `401` を受けたらログイン画面へ遷移
- `403` は権限不足表示（再ログインしても解消しない可能性あり）

### 推奨エラーハンドリング
- `401`: セッション切れとして扱い、`/login` へ誘導
- `403`: アクセス権なしメッセージを表示
- `409`（試合結果）: 「勝ち上がり元の結果確定待ち」の案内を表示
- `422`（試合結果）: 「入力対象試合の参加枠が不正」の案内を表示
- `409`（得点確定）: 「試合の完了・順位入力が不足」の案内を表示
- `422`（得点確定）: 「配点設定の不整合」の案内を表示
- `500`: 汎用エラー表示 + 再試行導線

### 実装例（hono client）

```ts
const res = await api.api.staff.matches[':matchId'].status.$patch({
  param: { matchId: 10 },
  json: { status: 'Playing' }
})

if (res.status === 401) {
  // ログインへ
}
```

```ts
const res = await api.api.staff.events[':eventId'].score.$post({
  param: { eventId: 3 }
})

if (res.status === 409) {
  // 入力不足ダイアログ
}
```

```ts
const res = await api.api.staff.matches[':matchId'].result.$post({
  param: { matchId: 10 },
  json: {
    participants: [
      { participantId: 101, score: 21, rank: 1, isDisqualified: false },
      { participantId: 102, score: 18, rank: 2, isDisqualified: false }
    ]
  }
})

if (res.status === 409) {
  // 依存試合結果待ち
}
```

## 補足
- CORSは `credentials: true` 前提で設定されています
- `localhost` と `127.0.0.1` の混在でCookie共有に失敗することがあるため、開発時はアクセスURLを統一してください
