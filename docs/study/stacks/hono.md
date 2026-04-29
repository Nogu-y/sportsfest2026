# Hono

## 何に使うか

API の URL と処理を書くための軽量フレームワークです。  
実務では「どの URL にアクセスされたら、何を返すか」を整理して実装します。

## このリポジトリでの役割

- `apps/api` の API サーバー本体
- `/` や `/health` のエンドポイントを定義している
- `/openapi.json` と `/docs` も Hono から公開している
- Node サーバー上で動かしている

## キーワード

- `route` / `endpoint`: URL と HTTP メソッドの組
- `handler`: 実際の処理を書く関数
- `c`: Context。リクエスト情報とレスポンス作成用の道具
- `c.json(...)`: JSON を返す基本形

## よく使う構文

### アプリの作成

```ts
const app = new Hono()
```

### GET ルート

```ts
app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})
```

### JSON を返す

```ts
return c.json({
  name: appName,
  service: 'api'
})
```

### パスを増やす

```ts
app.get('/teams', (c) => {
  return c.json({ items: [] })
})
```

## 実務で意識すること

- ルートが増えたら `routes/`、`handlers/`、`schemas/` に分けて詰め込みすぎない
- 入出力の型やバリデーションを意識する
- DB 操作とルーティングを同じ場所に書きすぎない
- `GET` と `POST` の役割を混ぜない

## このプロジェクトでまず見る場所

- `apps/api/src/index.ts`
- `apps/api/src/routes/system.ts`
