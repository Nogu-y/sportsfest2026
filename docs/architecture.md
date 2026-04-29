# アーキテクチャ概要

## 全体像

`sportsfest2026` は、フロントエンドと API を分離した pnpm モノレポです。  
型や環境変数スキーマなどの共通要素を `packages/shared` に寄せることで、アプリ間の整合性を保ちやすい構成にしています。

## 構成

### `apps/web`

- `Next.js 15` ベースのフロントエンドです
- `NEXT_PUBLIC_API_BASE_URL` を使って API の接続先を決定します
- 画面側でも `packages/shared` の値を利用できます

### `apps/api`

- `Hono` と `@hono/node-server` で構成された API です
- `Valibot` で入力・出力スキーマを定義し、`hono-openapi` で OpenAPI を自動生成します
- `@hono/swagger-ui` で API ドキュメント UI を公開します
- `Drizzle ORM` と `postgres` ドライバを利用して PostgreSQL に接続します
- DB スキーマは `src/db/schema.ts` に定義します

### `packages/shared`

- アプリ名のような共有定数
- Web/API の環境変数スキーマ
- 共有したい Zod スキーマや型
- Web と API の間で共有したい型の土台

### `packages/config`

- 共通 `tsconfig` をまとめる設定パッケージです

## 依存関係

```text
apps/web ─┐
          ├─> packages/shared
apps/api ─┘

apps/api ──> PostgreSQL
```

## 起動構成

開発時の役割分担は次の通りです。

- `web`: ホスト側で起動
- `api`: Docker コンテナで起動
- `db`: Docker コンテナで起動

このため、Web の変更は素早く反映しつつ、API と DB はコンテナ前提の環境差分を減らせます。

## 環境変数の扱い

環境変数スキーマは `packages/shared/src/env` で定義し、各アプリで `parse` しています。

- Web: `packages/shared/src/env/web.ts`
- API: `packages/shared/src/env/api.ts`

この方式により、設定値の欠落や型不整合を起動時に検出できます。

## 現在の実装状況

現状はひな型段階で、次の最小実装が入っています。

- Web のトップ画面
- API の `/` と `/health`
- API ドキュメントの `/openapi.json` と `/docs`
- サンプル用の Drizzle スキーマ `sample_records`

本実装を進める際は、機能単位で `apps/web` と `apps/api` を拡張し、共通化すべき型のみ `packages/shared` に寄せる方針が扱いやすいです。
