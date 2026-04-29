# Turborepo

## 何に使うか

モノレポ全体のビルドやチェックをまとめて実行するために使います。  
実務では、複数パッケージの作業を一括で回すときに便利です。

## このリポジトリでの役割

- ルートの `build`
- ルートの `check`
- ルートの `lint`

これらを各 package の script に流しています。

## キーワード

- ルート script は入口
- 実処理は各 package の `scripts` にある
- `turbo run check` は各 package の `check` をまとめて回すイメージ

## よく使う構文

### ルートからまとめて実行

```bash
pnpm build
pnpm check
pnpm lint
```

### package 側の script

```json
"check": "tsc --noEmit"
```

## 実務で意識すること

- ルート script は入口、実処理は各 package にある
- 失敗した package がどこかを見る
- まず個別 package で直し、最後に全体コマンドで確認する
- 一括確認と個別切り分けを往復する

## このプロジェクトでまず見る場所

- `package.json`
- `apps/web/package.json`
- `apps/api/package.json`
- `packages/shared/package.json`
