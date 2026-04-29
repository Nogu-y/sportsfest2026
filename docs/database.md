# データベースと Drizzle

## 使用技術

- Database: `PostgreSQL 16`
- ORM: `Drizzle ORM`
- Migration Tool: `drizzle-kit`

## 関連ファイル

- スキーマ定義: `apps/api/src/db/schema.ts`
- DB クライアント: `apps/api/src/db/client.ts`
- Drizzle 設定: `apps/api/drizzle.config.ts`
- API 環境変数: `apps/api/src/env.ts`

## スキーマ変更の流れ

1. `apps/api/src/db/schema.ts` を更新する
2. マイグレーションを生成する
3. マイグレーションを適用する
4. API 側の参照コードを必要に応じて更新する

実行コマンド:

```bash
pnpm --filter @sportsfest/api db:generate
pnpm --filter @sportsfest/api db:migrate
```

## 接続設定

DB 接続は `DATABASE_URL` を通して行います。

開発環境の既定値:

```env
DATABASE_URL=postgres://postgres:postgres@db:5432/sportsfest2026
```

`db` は Docker Compose 上のサービス名です。  
そのため、API をコンテナ外で直接起動する場合は接続先の見直しが必要です。

## 運用上の注意

- スキーマ定義と実 DB の状態をずらさないこと
- カラム追加・変更時は API の入出力仕様も合わせて確認すること
- 共有スキーマ化が必要なら `packages/shared` も更新すること


