# セットアップ手順

## 前提環境

このプロジェクトでは、次のツールを前提にしています。

- `Node.js 22` 系
- `pnpm 10`
- `Docker` / `Docker Compose`

## 1. 依存関係をインストール

```bash
pnpm install
```

## 2. 環境変数ファイルを作成

テンプレートから `.env` を作成します。

```bash
cp apps/web/env.example apps/web/.env
cp apps/api/env.example apps/api/.env
```

### `apps/web/.env`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8787
```

- Web アプリから参照する API のベース URL です

### `apps/api/.env`

```env
PORT=8787
POSTGRES_DB=sportsfest2026
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgres://postgres:postgres@db:5432/sportsfest2026
```

- `DATABASE_URL` は Docker Compose 内の `db` サービスを向く設定です
- `PORT` は API コンテナ内部・公開ポートの両方に使われます

## 3. 開発環境を起動

```bash
pnpm dev
```

このコマンドで以下が起動します。

- `apps/web`: ローカルで `next dev`
- `apps/api`: Docker コンテナ内で `tsx watch`
- `db`: PostgreSQL コンテナ

## 4. 動作確認

起動後、次の URL にアクセスして確認します。

- Web: `http://localhost:3000`
- API: `http://localhost:8787`
- Health Check: `http://localhost:8787/health`

API の `/` では、サービス名や状態を返します。

## 停止方法

```bash
pnpm dev:down
```

`docker compose down` により、`api` と `db` を停止してコンテナを削除します。  
DB データは bind mount と volume に保持されるため、通常の `pnpm dev:down` だけでは消えません。  
Web 側の `next dev` は `pnpm dev` を終了すると停止します。

## 補足

- `api` コンテナは起動時に `pnpm install --no-frozen-lockfile` を実行します
- DB データは `./apps/db/data` に永続化されます
- 環境変数は起動時に Zod スキーマで検証されます
