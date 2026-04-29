# 開発の全体像

## このプロジェクトで作っているもの

このリポジトリは、高専体育大会向けの Web アプリケーションの土台です。  
画面を表示する部分と、データを返す部分と、データを保存する部分を分けて作っています。

## 3 つの主要パート

### 1. Web フロントエンド

- 場所: `apps/web`
- 役割: ブラウザに画面を表示する
- 主な技術: `Next.js`、`React`

### 2. API サーバー

- 場所: `apps/api`
- 役割: Web からのリクエストを受けて、必要なデータを返す
- 主な技術: `Hono`、`TypeScript`

### 3. データベース

- 役割: データを保存する
- 主な技術: `PostgreSQL`
- 開発時は `docker compose` で起動する

## データの流れ

```text
ブラウザ
  ↓
apps/web
  ↓ HTTP 通信
apps/api
  ↓
PostgreSQL
```

## よくある作業と変更場所

- 画面の文章や見た目を変えたい: `apps/web`
- API の返す内容を変えたい: `apps/api`
- 保存するデータの形を変えたい: `apps/api/src/db/schema.ts`
- Web と API で共通の型を持ちたい: `packages/shared`

## まず理解するとよいこと

- `pnpm dev` で開発環境を起動できる
- `apps/web` と `apps/api` は別のアプリ
- `packages/shared` は共通部品置き場
- DB の変更には `db:generate` と `db:migrate` を使う
