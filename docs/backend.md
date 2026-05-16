# バックエンド設計ガイド

## このドキュメントの目的

このプロジェクトの API は、`apps/api/src` 配下で役割ごとにファイルを分けて実装します。  
初めてチーム開発をする人でも、「どこに何を書くべきか」が分かるように、現在の構成と実装ルールを整理します。

## まず全体像

バックエンドの主な構成は次の通りです。

```text
apps/api/src
├─ db
│  ├─ client.ts
│  ├─ enums.ts
│  └─ schema.ts
├─ repositories
│  └─ public
├─ routes
│  ├─ public
│  └─ system.ts
├─ schemas
│  ├─ public
│  ├─ common.ts
│  └─ system.ts
├─ utils
│  ├─ dates.ts
│  ├─ response.ts
│  └─ schemaParser.ts
├─ env.ts
├─ index.ts
└─ openapi.ts
```

役割は大きく次のように分かれています。

- `routes`: HTTP リクエストを受け取り、レスポンスを返す
- `schemas`: リクエスト・レスポンスの型と API 仕様を定義する
- `repositories`: DB からデータを取得・更新する
- `utils`: 複数の場所で再利用する小さな共通処理を置く
- `db`: DB 接続やテーブル定義をまとめる

## リクエストが処理される流れ

たとえば `public/live` 系の API は、だいたい次の順番で動きます。

1. `index.ts` で API 全体にルートを登録する
2. `routes/public/index.ts` で機能ごとのルートをまとめる
3. `routes/public/live.ts` でエンドポイントの処理を書く
4. `schemas/public/live.ts` で入力・出力スキーマと OpenAPI 定義を参照する
5. `repositories/public/live.ts` で DB 取得やデータ整形を行う
6. `utils` の共通関数を必要に応じて使う

この流れに沿うと、責務が混ざりにくくなります。

## Utility 関数と使い方

### Utility 関数を置く目的

`utils` には、次のような「複数箇所で使えるが、特定機能には属しない処理」を置きます。

- 日付変換
- レスポンスの共通整形
- OpenAPI 用の request / response 定義の組み立て

逆に、ある 1 機能でしか使わない処理は、まずその機能の `repository` や `route` の近くに置く方が読みやすいです。

### 現在ある Utility の例

#### `utils/dates.ts`

- `toIsoString(value)`
  - `Date | null` を `string | null` に変換します
  - API レスポンスで日時を ISO 文字列として返したい時に使います
- `toUnixTime(value)`
  - `Date | null` を Unix time に変換します
  - Push Subscription の期限のように数値で返したい時に使います

使い方の例:

```ts
startedAt: toIsoString(match.startedAt)
expirationTime: toUnixTime(row.expiration)
```

#### `utils/response.ts`

- `createNotFoundResponse(message)`
  - `{ message: string }` の形をそろえるための関数です
  - 404 レスポンスのメッセージを統一したい時に使います

使い方の例:

```ts
return c.json(
  createNotFoundResponse('対象 UUID のサブスクリプションが見つかりません'),
  404
)
```

#### `utils/schemaParser.ts`

OpenAPI の `request` / `response` 定義を毎回手書きしないための補助関数です。

- `createReqBody(schema, required)`
  - JSON のリクエストボディ定義を作る
- `createResBody(schema, desc)`
  - 正常レスポンス定義を作る
- `createErrResBody(desc)`
  - エラーレスポンス定義を作る

使い方の例:

```ts
request: createReqBody(WatchlistReqSchema, true),
responses: {
  200: createResBody(WatchlistResSchema, '取得成功'),
  404: createErrResBody('UUID が見つからない')
}
```

### Utility を作る時の判断基準

次の条件を満たすなら、`utils` に切り出す価値があります。

- 2 箇所以上で使う見込みがある
- 名前だけで役割が分かる
- 機能固有の文脈に依存しすぎない

逆に、次のような処理は無理に `utils` にしない方が安全です。

- 特定テーブル専用の整形
- その API でしか使わない分岐
- まだ 1 回しか使っていない処理

## Zod によるスキーマ定義のやり方

このプロジェクトでは `@hono/zod-openapi` の `z` を使ってスキーマを定義します。  
実態は Zod ベースなので、入力検証・型推論・OpenAPI 定義を 1 か所に集約できます。

### 基本方針

- 共通で使う基本スキーマは `schemas/common.ts` に置く
- 機能ごとの request / response は `schemas/public/*.ts` に置く
- `z.infer<typeof Schema>` で TypeScript 型を取り出す
- `createRoute(...)` で API 仕様まで同じファイルに書く

### 共通スキーマの例

`schemas/common.ts` では、複数機能で使う基本型を定義しています。

- `uuidSchema`
- `positiveIntegerSchema`
- `isoDateTimeSchema`
- `errorResponseSchema`

こうしておくと、バリデーション基準が API 全体でそろいます。

### 機能ごとのスキーマ定義手順

例として `watchlist` 系を考えると、流れは次の通りです。

1. Query や Body の入力スキーマを作る
2. レスポンススキーマを作る
3. `createRoute(...)` でエンドポイント仕様を定義する
4. 必要なら `z.infer` で型を export する

例:

```ts
export const WatchlistReqSchema = z.object({
  uuid: uuidSchema,
  matchPlanIds: z.array(positiveIntegerSchema)
})

export const WatchlistResSchema = z.object({
  uuid: uuidSchema,
  matchPlanIds: z.array(positiveIntegerSchema)
})

export type WatchlistReq = z.infer<typeof WatchlistReqSchema>
```

### 命名の考え方

初見でも意味が分かる名前にそろえるのが重要です。

- `XxxQuerySchema`: Query string 用
- `XxxReqSchema`: Request body 用
- `XxxResSchema`: Response body 用
- `XxxResponse`: 実際に扱う TypeScript 型

今後さらにそろえるなら、次のような統一もおすすめです。

- route 定義: `getWatchlistRoute` のように HTTP メソッドと対象を入れる
- schema: `watchlistItemSchema` のように小さい部品にも役割名を付ける

### スキーマ定義で意識すること

- API で返す形をそのまま素直に書く
- DB の型をそのまま外へ出さない
- `nullable()` と `optional()` を混同しない
  - `nullable()`: 値はあるが `null` を許す
  - `optional()`: プロパティ自体がなくてもよい

## エンドポイントの書き方

### どこに書くか

エンドポイント本体は `routes` に書きます。

- `routes/public/*.ts`: 公開 API
- `routes/system.ts`: システム系 API

複数のルートをまとめる時は `routes/public/index.ts` のような集約ファイルで `.route(...)` します。

### 基本の書き方

このプロジェクトでは `OpenAPIHono` に対して `.openapi(...)` を使います。

基本形は次の通りです。

```ts
export const sampleRoutes = new OpenAPIHono()
  .openapi(sampleRoute, async (c) => {
    const input = c.req.valid('json')
    const result = await someRepository(input)

    return c.json(result, 200)
  })
```

ポイントは次の通りです。

- ルート定義そのものは `schemas` 側の `createRoute(...)` を使う
- ハンドラ内では `c.req.valid(...)` で検証済みの値を受け取る
- DB 処理は `repository` に任せる
- HTTP ステータスコードの判断は `route` で行う

### 実装時のおすすめ手順

1. `schemas` に request / response と `createRoute(...)` を書く
2. `repositories` に必要な DB 処理を書く
3. `routes` で `c.req.valid(...)` を使って受け取り、repository を呼ぶ
4. `routes/.../index.ts` でルートを束ねる
5. `index.ts` に最上位ルートを登録する

### route に書いてよいこと

- リクエストの受け取り
- バリデーション済み値の取得
- repository 呼び出し
- ステータスコードの分岐
- ヘッダー設定
- エラーレスポンス返却

たとえば `live.ts` の ETag 制御のような、HTTP レイヤーに近い処理は route に置くのが自然です。

### route に書きすぎない方がよいこと

- 複雑な SQL 条件
- 大量のデータ整形
- テーブル横断の取得ロジック
- 再利用したいドメインロジック

これらは `repository` などに逃がした方が保守しやすくなります。

## 最小構成の GET / POST 例

ここでは、`memo` という簡単な API を例にして、最小構成の作り方を示します。  
今度は実際の開発に近づけるために、DB テーブルの追加、repository での DB 操作、`routes/public/index.ts` への登録、必要に応じた `index.ts` での最上位登録まで含めて説明します。

### 作るファイル

```text
apps/api/src
├─ db/schema.ts
├─ repositories/public/memo.ts
├─ routes/public/memo.ts
├─ routes/public/index.ts
├─ schemas/public/memo.ts
└─ index.ts
```

`memo` を `public` 配下に追加するなら、通常は `routes/public/index.ts` までの変更で足ります。  
`index.ts` はすでに `.route('/api/public', publicRoutes)` を持っているためです。  
ただし、新しいトップレベル群を増やす場合は `index.ts` の登録も必要になります。

### 0. DB テーブルを定義する
ただし、今回はすでにテーブル定義を作ってあるので、追加するというより確認する作業がメインになると思います。

`db/schema.ts`

```ts
import {
  pgTable,
  serial,
  timestamp,
  varchar
} from 'drizzle-orm/pg-core'

export const memos = pgTable('memos', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', {
    withTimezone: true
  })
    .notNull()
    .defaultNow()
})
```

※以下手順はテーブルを追加・更新した場合に反映させる方法です

1. `db/schema.ts` を更新する
2. マイグレーションを生成する
3. マイグレーションを適用する

実行コマンド:

```bash
pnpm --filter @sportsfest/api db:generate
pnpm --filter @sportsfest/api db:migrate
```

### 1. schema を定義する

`schemas/public/memo.ts`

```ts
import { createRoute, z } from '@hono/zod-openapi'
import {
  createErrResBody,
  createReqBody,
  createResBody
} from '../../utils/schemaParser'
import {
  isoDateTimeSchema,
  positiveIntegerSchema
} from '../common'

const memoSchema = z.object({
  id: positiveIntegerSchema,
  title: z.string(),
  createdAt: isoDateTimeSchema
})

export const getMemoResSchema = memoSchema.openapi('PublicMemoResponse')

export const createMemoReqSchema = z.object({
  title: z.string().min(1)
}).openapi('PublicCreateMemoRequest')

export const createMemoResSchema = memoSchema.openapi('PublicCreateMemoResponse')

export const getMemoRoute = createRoute({
  path: '/',
  method: 'get',
  tags: ['public'],
  summary: 'メモを 1 件返す',
  responses: {
    200: createResBody(getMemoResSchema, '取得成功'),
    404: createErrResBody('メモが見つからない')
  }
})

export const postMemoRoute = createRoute({
  path: '/',
  method: 'post',
  tags: ['public'],
  summary: 'メモを 1 件作成する',
  request: createReqBody(createMemoReqSchema, true),
  responses: {
    201: createResBody(createMemoResSchema, '作成成功')
  }
})

export type MemoRes = z.infer<typeof getMemoResSchema>
export type CreateMemoReq = z.infer<typeof createMemoReqSchema>
```

ここでやっていることは次の 3 つです。

- request / response の型を定義する
- `createRoute(...)` で API 仕様を定義する
- `z.infer` で repository から使う型を取り出す

### 2. repository を定義する

`repositories/public/memo.ts`

```ts
import { asc } from 'drizzle-orm'
import { db } from '../../db/client'
import { memos } from '../../db/schema'
import type {
  CreateMemoReq,
  MemoRes
} from '../../schemas/public/memo'

const mapMemo = (row: typeof memos.$inferSelect): MemoRes => ({
  id: row.id,
  title: row.title,
  createdAt: row.createdAt.toISOString()
})

export const getLatestMemo = async () => {
  const [row] = await db
    .select()
    .from(memos)
    .orderBy(asc(memos.id))
    .limit(1)

  if (!row) {
    return null
  }

  return mapMemo(row)
}

export const createMemo = async (input: CreateMemoReq) => {
  const [row] = await db
    .insert(memos)
    .values({
      title: input.title
    })
    .returning()

  return mapMemo(row)
}
```

repository では DB アクセスを担当させます。

- `select` / `insert` などの DB 操作を書く
- DB の行を API のレスポンス形へ変換する
- HTTP の `404` や `201` は route 側に判断させる

### 3. route を定義する

`routes/public/memo.ts`

```ts
import { OpenAPIHono } from '@hono/zod-openapi'
import {
  getMemoRoute,
  postMemoRoute
} from '../../schemas/public/memo'
import {
  createMemo,
  getLatestMemo
} from '../../repositories/public/memo'
import { createNotFoundResponse } from '../../utils/response'

export const publicMemoRoutes = new OpenAPIHono()
  .openapi(getMemoRoute, async (c) => {
    const memo = await getLatestMemo()

    if (!memo) {
      return c.json(createNotFoundResponse('メモが見つかりません'), 404)
    }

    return c.json(memo, 200)
  })
  .openapi(postMemoRoute, async (c) => {
    const input = c.req.valid('json')
    const memo = await createMemo(input)
    return c.json(memo, 201)
  })
```

このファイルでは HTTP の責務だけを扱います。

- GET / POST を受ける
- `c.req.valid('json')` で検証済みの入力を受け取る
- repository を呼ぶ
- status code を返す

### 4. `routes/public/index.ts` に登録する

`routes/public/index.ts`

```ts
import { OpenAPIHono } from '@hono/zod-openapi'
import { publicMemoRoutes } from './memo'

export const publicRoutes = new OpenAPIHono()
  .route('/memo', publicMemoRoutes)
```

既存の `publicRoutes` にぶら下げることで、`/api/public/memo` という URL にまとまります。

### 5. `index.ts` での最上位登録を確認する

`index.ts`

```ts
export const app = $(
  new OpenAPIHono()
    .use('/*', cors())
    .route('/api/system', systemRoutes)
    .route('/api/public', publicRoutes)
)
```

`memo` が `publicRoutes` の中にあるなら、通常はここを追加で変更する必要はありません。  
すでに `/api/public` が登録されているからです。

逆に、たとえば `/api/admin` のような新しいグループを作るなら、ここに `.route('/api/admin', adminRoutes)` を追加します。

### 6. これで追加される API

- `GET /api/public/memo`
- `POST /api/public/memo`

### この例から分かること

最小構成でも、責務は次のように分けます。

- `db/schema.ts`: テーブル定義
- `schema`: 入出力の型と API 仕様
- `repository`: DB への取得・作成
- `route`: HTTP の受け口
- `routes/public/index.ts`: `public` グループへの登録
- `index.ts`: 最上位グループの登録

この分け方にしておくと、あとから DB をつなぐ時も置き換えやすいです。  
最初は少しファイル数が多く見えますが、チーム開発ではこの分離の方が読みやすく、修正箇所も追いやすくなります。

## 役割分離の戦略

### 基本戦略

役割分離の目的は、変更に強くすることです。  
「どの理由でそのコードが変わるか」を基準に分けると、構造が崩れにくくなります。

このプロジェクトでは、次の分け方を基本にします。

#### `schemas`

- API の入出力仕様を管理する
- バリデーションルールを管理する
- OpenAPI に載せる情報を管理する

#### `routes`

- HTTP の入り口を担当する
- request を受けて repository を呼ぶ
- status code や header を決める

#### `repositories`

- DB とのやり取りを担当する
- select / insert / update / delete をまとめる
- DB の行を API 向けのデータに変換する

#### `utils`

- 小さく汎用的な再利用処理を担当する

### なぜこの分け方がよいか

たとえばレスポンスの項目名を変えたい時、主に見るべき場所は `schemas` と `repository` です。  
DB の検索条件を変えたい時は `repository` を見ればよく、HTTP ステータスを変えたい時は `route` を見れば済みます。

つまり、変更理由と修正箇所が対応しやすくなります。

### 1 ファイルに詰め込みすぎないための目安

次の状態になったら分割を検討してください。

- route ファイルの中で SQL を直接長く書いている
- schema ファイルが 1 エンドポイントだけで 200 行を大きく超える
- repository に別機能の処理まで混ざっている
- utility が実質その機能専用になっている

### 新しい API を追加する時のおすすめ構成

たとえば `results` という公開 API を追加するなら、最低限この形にそろえると追いやすいです。

```text
apps/api/src
├─ repositories/public/results.ts
├─ routes/public/results.ts
└─ schemas/public/results.ts
```

必要なら `routes/public/index.ts` に追加します。

### チーム開発で特に大事なこと

- 「動く場所」より「置くべき場所」を優先する
- 同じ責務のコードは同じ階層に寄せる
- 共通化は早すぎても遅すぎても読みにくくなるので、2 回以上出てから検討する
- DB の都合と API の都合を分けて考える

## 実装ルールのまとめ

- スキーマは `schemas` に置く
- HTTP 処理は `routes` に置く
- DB 処理は `repositories` に置く
- 共通の小物関数は `utils` に置く
- 共通バリデーションは `schemas/common.ts` に寄せる
- API レスポンスは DB の生データをそのまま返さず、必要に応じて整形する

## 迷った時の判断順

実装場所に迷ったら、次の順番で考えるのがおすすめです。

1. これは API の入出力仕様か
2. これは HTTP の責務か
3. これは DB アクセスの責務か
4. これは複数箇所で使う共通処理か
5. それでも違うなら、その機能の近くに置く

この順番で切り分けると、大きく外しにくいです。

詳しく知りたいときは
`zod-openapi`とかで検索
[公式Doc](https://hono.dev/examples/zod-openapi) 