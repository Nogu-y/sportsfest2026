# Valibot

## 何に使うか

API の入力値や出力値の形を定義し、実行時にチェックするためのバリデーションライブラリです。  
「この JSON はどんな形で受け取るか」を明確にしたいときに使います。

## このリポジトリでの役割

- `apps/api/src/schemas` で API のレスポンスや入力スキーマを定義する
- `hono-openapi` と組み合わせて OpenAPI を自動生成する
- Hono ルートの実装と API ドキュメントの定義元をできるだけそろえる

## キーワード

- `schema`: 値の形を表す定義
- `object`: オブジェクトの形を定義する
- `pipe(...)`: バリデーションや説明を後ろから追加する
- `InferOutput`: schema から TypeScript の型を取り出す

## よく使う構文

### オブジェクトの定義

```ts
const healthStatusSchema = v.object({
  status: v.literal('ok')
})
```

### 説明やメタ情報を付ける

```ts
const schema = v.pipe(
  v.object({
    status: v.literal('ok')
  }),
  v.description('ヘルスチェック結果'),
  v.metadata({ ref: 'HealthStatus' })
)
```

### 型を取り出す

```ts
type HealthStatus = v.InferOutput<typeof healthStatusSchema>
```

## 実務で意識すること

- ルートの中に schema を直書きしすぎない
- request 用と response 用を分けておくと見通しがよい
- API ドキュメント生成も同じ schema を使えるように寄せる

## このプロジェクトでまず見る場所

- `apps/api/src/schemas/system.ts`
