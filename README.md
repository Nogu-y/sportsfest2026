# sportsfest2026

高専体育大会向けの Web アプリケーション基盤です。  
このリポジトリは、`Next.js` のフロントエンド、`Hono` の API、`PostgreSQL` と `Drizzle ORM` を組み合わせた pnpm モノレポとして構成されています。

## 概要

- フロントエンド: `apps/web`
- API サーバー: `apps/api`
- 共有スキーマ・定数: `packages/shared`
- 共通設定: `packages/config`

現時点では、開発用のひな型として次の要素が整っています。

- `web` と `api` の分離
- 共有パッケージによる環境変数スキーマの共通化
- `docker compose` による PostgreSQL / API の起動
- `Drizzle` によるスキーマ管理の土台

## 技術スタック

- `pnpm` workspace
- `Turborepo`
- `Next.js 15`
- `React 19`
- `Hono`
- `PostgreSQL 16`
- `Drizzle ORM`
- `TypeScript`

## ディレクトリ構成

```text
.
├── apps/
│   ├── api/        # Hono API と DB 関連
│   └── web/        # Next.js フロントエンド
├── docs/           # 詳細ドキュメント
├── packages/
│   ├── config/     # tsconfig などの共通設定
│   └── shared/     # 共有定数・Zod スキーマ
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## セットアップ

### 前提

- `Node.js 22` 系
- `pnpm 10`
- `Docker` / `Docker Compose`

### 初期セットアップ

1. 依存関係をインストールします

```bash
pnpm install
```

2. 環境変数ファイルを作成します

```bash
cp apps/web/env.example apps/web/.env
cp apps/api/env.example apps/api/.env
```

3. 開発環境を起動します

```bash
pnpm dev
```

起動後の想定 URL:

- Web: `http://localhost:3000`
- API: `http://localhost:8787`
- API ヘルスチェック: `http://localhost:8787/health`

## よく使うコマンド

```bash
pnpm dev         # web と api/db をまとめて起動
pnpm dev:down    # api/db を停止してコンテナを削除
pnpm build       # 全ワークスペースをビルド
pnpm check       # TypeScript の型チェック
pnpm lint        # 各ワークスペースの lint 相当処理
```

API アプリ単体で使うコマンド:

```bash
pnpm --filter @sportsfest/api db:generate
pnpm --filter @sportsfest/api db:migrate
```

## 開発の流れ

1. `apps/web/.env` と `apps/api/.env` を用意する
2. `pnpm dev` で Web / API / DB を起動する
3. Web から API の疎通を確認する
4. スキーマ変更が必要な場合は `apps/api/src/db/schema.ts` を更新する
5. 必要に応じて `db:generate` / `db:migrate` を実行する

## ドキュメント

- [ドキュメント一覧](./docs/README.md)
- [セットアップ手順](./docs/setup.md)
- [アーキテクチャ概要](./docs/architecture.md)
- [開発ガイド](./docs/development.md)
- [データベースと Drizzle](./docs/database.md)
- [初心者向けガイド](./docs/study/README.md)

## 初めて参加する方向け

開発にまだ慣れていない場合は、いきなりコードを読むより次の順で進めるのがおすすめです。

1. [セットアップ手順](./docs/setup.md) を見て開発環境を起動する
2. [初心者向けガイド](./docs/study/README.md) で全体像をつかむ
3. [コマンド早見表](./docs/study/command-cheatsheet.md) を手元に置いて作業する
4. [初回確認チェックリスト](./docs/study/first-steps.md) で見るべきポイントを確認する

## 補足

- `pnpm dev` は `web` をローカル実行し、`api` と `db` を `docker compose` で起動します
- API コンテナ起動時に `pnpm install --no-frozen-lockfile` が実行されます
- 環境変数のバリデーションは `packages/shared` の Zod スキーマで共通化されています
