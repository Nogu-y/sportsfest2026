# 開発ガイド

## 基本方針

- フロントエンドは `apps/web`
- API は `apps/api`
- 共通化が必要な定数・スキーマ・型は `packages/shared`
- 共通設定は `packages/config`

責務の異なる実装を 1 ファイルに詰め込まず、アプリごと・機能ごとに分けて管理してください。

## よく使うコマンド

```bash
pnpm dev
pnpm dev:down
pnpm build
pnpm check
pnpm lint
```

個別実行例:

```bash
pnpm --filter @sportsfest/web dev
pnpm --filter @sportsfest/api dev
pnpm --filter @sportsfest/api check
```

## 実装時の考え方

### フロントエンドを追加する場合

- 画面やレイアウトは `apps/web/src/app` 配下に配置します
- API 接続先は `NEXT_PUBLIC_API_BASE_URL` を参照します
- Web 専用の関心事は `apps/web` に閉じ込めます

### API を追加する場合

- アプリ本体は `apps/api/src/index.ts`、起動処理は `apps/api/src/server.ts` です
- ルートや処理が増えたら、責務ごとにファイルを分割してください
- ルート定義は `apps/api/src/routes`、実行処理は `apps/api/src/handlers`、API 入出力スキーマは `apps/api/src/schemas` に寄せると見通しを保ちやすくなります
- OpenAPI の全体設定とルートごとのドキュメント定義は `apps/api/src/openapi` に置きます
- API ドキュメントに載せるルートは `hono-openapi` の `describeRoute(...)` と `resolver(...)` を使って定義します
- DB アクセスは `src/db` 配下に寄せると見通しを保ちやすくなります

### 共通コードを追加する場合

- Web と API の両方で使うものだけを `packages/shared` に置きます
- 一方のアプリだけで使うコードは無理に共有化しません

## 推奨フロー

1. 変更対象が `web` / `api` / `shared` のどこかを最初に決める
2. 必要なら環境変数や共有スキーマを追加する
3. `pnpm check` で型整合性を確認する
4. DB 変更がある場合は `database.md` の手順に従う

## 注意点

- `lint` は現状プレースホルダーです
- API は Docker 内で起動するため、DB 接続先はコンテナネットワーク前提です
- `packages/shared` の変更は Web/API の両方に影響する可能性があります
- API の OpenAPI JSON は `/openapi.json`、Swagger UI は `/docs` です
