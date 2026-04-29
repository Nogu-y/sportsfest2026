# Hono RPC

## 何に使うか

Hono のルート定義から、クライアント側で使う API 呼び出しの型を共有する仕組みです。  
URL やリクエスト形式を手で文字列管理する量を減らせます。

## このリポジトリでの役割

- `apps/api` で定義した Hono アプリの型を外へ公開する
- Web や別クライアントから `hc<AppType>(...)` で型安全に API を呼べるようにする
- API 実装とクライアント呼び出しのずれを減らす

## キーワード

- `AppType`: Hono アプリから取り出した型
- `typeof app`: ルート情報を型として取り出す基本形
- `hc(...)`: Hono のクライアント作成関数

## よく使う構文

### サーバー側で型を公開する

```ts
export const app = new Hono()

export type AppType = typeof app
```

### クライアントを作る

```ts
const client = hc<AppType>('http://localhost:8787')
```

### ルートを呼ぶ

```ts
const res = await client.health.$get()
```

## 実務で意識すること

- サーバー起動用ファイルとアプリ定義ファイルを分ける
- `AppType` は Hono アプリ本体から export する
- RPC の型共有と OpenAPI 生成は別物なので、両方の役割を分けて考える

## このプロジェクトでまず見る場所

- `apps/api/src/index.ts`
- `apps/api/src/server.ts`
