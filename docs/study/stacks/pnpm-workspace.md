# pnpm workspace

## 何に使うか

複数のパッケージを 1 つのリポジトリで管理するために使います。  
実務では、フロントエンド・API・共通ライブラリをまとめて扱いやすくなります。

## このリポジトリでの役割

- `apps/web`
- `apps/api`
- `packages/shared`
- `packages/config`

これらを 1 つの workspace として扱っています。

## キーワード

- `workspace`: 複数 package をまとめる単位
- `package`: `package.json` を持つ単位
- `--filter`: 対象 package を絞る指定
- `workspace:*`: 同じリポジトリ内 package を参照する書き方

## よく使う構文

### workspace 設定

```yml
packages:
  - apps/*
  - packages/*
```

### パッケージ指定で実行

```bash
pnpm --filter @sportsfest/api dev
```

### workspace 参照

```json
"@sportsfest/shared": "workspace:*"
```

## 実務で意識すること

- 共通化しすぎない
- 依存の向きをシンプルに保つ
- どの package がどの責務かを明確にする
- `apps` は実行されるアプリ、`packages` は部品や設定、と分けて見ると追いやすい

## このプロジェクトでまず見る場所

- `pnpm-workspace.yaml`
- `package.json`
- `apps/web/package.json`
- `apps/api/package.json`
