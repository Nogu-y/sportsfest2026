# コマンド早見表

## 最重要コマンド

```bash
pnpm install
pnpm dev
pnpm dev:down
pnpm check
pnpm build
```

## 何をするときに使うか

| コマンド | 用途 |
| --- | --- |
| `pnpm install` | 依存関係をインストールする |
| `pnpm dev` | Web / API / DB をまとめて起動する |
| `pnpm dev:down` | API / DB を停止してコンテナを削除する |
| `pnpm check` | TypeScript の型エラーを確認する |
| `pnpm build` | 本番向けビルドが通るか確認する |

※「依存関係をインストールする」とは、アプリケーションの起動に必要なライブラリなどをインストールすることを指します。
※`pnpm dev:down` は停止だけでなくコンテナ削除まで行います。ただし、このプロジェクトでは DB データ自体は通常残ります。

## よく使う個別コマンド

```bash
pnpm --filter @sportsfest/web dev
pnpm --filter @sportsfest/api dev
pnpm --filter @sportsfest/api db:generate
pnpm --filter @sportsfest/api db:migrate
```

| コマンド | 用途 |
| --- | --- |
| `pnpm --filter @sportsfest/web dev` | Web だけ起動する |
| `pnpm --filter @sportsfest/api dev` | API だけ起動する |
| `pnpm --filter @sportsfest/api db:generate` | Drizzle のマイグレーションを生成する |
| `pnpm --filter @sportsfest/api db:migrate` | マイグレーションを DB に適用する |

## 困ったとき

- 起動しない: `.env` があるか確認する
- 型エラーが出た: `pnpm check` の表示を読む
- DB につながらない: `pnpm dev` で `db` が起動しているか確認する
- 何を叩けばよいかわからない: まず `pnpm dev` と `pnpm check` を覚える
