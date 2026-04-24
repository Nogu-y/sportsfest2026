# Drizzle ORM

## 何に使うか

TypeScript で DB スキーマやクエリを扱いやすくするための ORM です。  
実務では「型安全に DB を触る」「変更履歴を管理する」ために使います。

## このリポジトリでの役割

- `schema.ts` でテーブル定義を書く
- `drizzle.config.ts` で migration 設定を持つ
- `db:generate` と `db:migrate` で変更を反映する

## キーワード

- `schema`: テーブル構造そのもの
- `migration`: DB 変更履歴
- `generate`: migration ファイルを作る
- `migrate`: 実 DB に反映する
- `drizzle(client)`: DB 接続の上に Drizzle を乗せる初期化

## よく使う構文

### テーブル定義

```ts
export const sampleRecords = pgTable('sample_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull()
})
```

### DB クライアント

```ts
const client = postgres(apiEnv.DATABASE_URL)
export const db = drizzle(client)
```

### よく使うコマンド

```bash
pnpm --filter @sportsfest/api db:generate
pnpm --filter @sportsfest/api db:migrate
```

### カラム追加のイメージ

```ts
status: text('status').notNull().default('draft')
```

## 実務で意識すること

- スキーマ変更後は migration を忘れない
- テーブルが増えたらファイル分割を考える
- DB の都合だけでなく API の入力・出力も一緒に見る
- 既存データがある前提で変更影響を考える

## このプロジェクトでまず見る場所

- `apps/api/src/db/schema.ts`
- `apps/api/src/db/client.ts`
- `apps/api/drizzle.config.ts`
