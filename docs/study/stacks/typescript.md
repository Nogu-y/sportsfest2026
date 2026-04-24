# TypeScript

## 何に使うか

JavaScript に型を付けて、データの形を明確にするために使います。  
実務では「思っていた値と違った」を早めに防ぐ役割が大きいです。

## このリポジトリでの役割

- Web と API の両方で使う
- `packages/shared` に共通の型やスキーマを置ける
- `pnpm check` で型の不整合を確認する

## キーワード

- `type`: 形の定義や別名
- `: string`: 型注釈
- `children: React.ReactNode`: React の子要素
- `z.infer<typeof schema>`: Zod から型を作る書き方

## よく使う構文

### 型付きの props

```ts
type RootLayoutProps = {
  children: React.ReactNode
}
```

### オブジェクトの型

```ts
type HealthResponse = {
  status: 'ok'
}
```

### 関数の戻り値

```ts
function getLabel(count: number): string {
  return `件数: ${count}`
}
```

### スキーマから型を作る

```ts
export type ApiEnv = z.infer<typeof apiEnvSchema>
```

## 実務で意識すること

- `any` は最後の手段にする
- 共通で使う型だけを `packages/shared` に置く
- 型名は「何のデータか」が分かる名前にする
- 型が複雑になりすぎたら分割する
- コンパイルを通すためだけでなく、意図が伝わる型名にする

## このプロジェクトでまず見る場所

- `apps/web/src/app/layout.tsx`
- `apps/api/src/env.ts`
- `packages/shared/src/env/api.ts`
