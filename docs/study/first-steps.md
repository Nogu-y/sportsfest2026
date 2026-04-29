# 初回確認チェックリスト

このページは、開発環境を壊さずに「どこを見ると全体像を把握しやすいか」を確認するための資料です。  

## 目的

- 開発環境の起動方法を知る
- Web / API / DB がそれぞれどこにあるか把握する
- 変更前に確認しておくべき URL やファイルを知る

## 1. 開発環境を起動する

```bash
pnpm dev
```

## 2. 起動後の URL を確認する

- Web: `http://localhost:3000`
- API: `http://localhost:8787`
- API Health Check: `http://localhost:8787/health`

## 3. まず読むとよいファイル

- `apps/web/src/app/page.tsx`
  - Web のトップページです
- `apps/api/src/index.ts`
  - API の入口です
- `apps/api/src/db/schema.ts`
  - DB テーブル定義です
- `packages/shared/src/index.ts`
  - 共有定数やスキーマの入口です

## 4. 見るポイント

- Web では何が表示されているか
- API の `/` と `/health` が何を返すか
- DB スキーマにどんなテーブルがあるか
- 共通コードがどこにまとまっているか

## 5. 確認後に実行するとよいコマンド

```bash
pnpm check
```

型チェックを通して、現在のコードベースが少なくとも型の観点では整合しているか確認できます。

## 次に読む資料

- `docs/architecture.md`
- `docs/development.md`
- `docs/database.md`
