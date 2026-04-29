# React / Next.js

## 先に結論

- `React`: UI 部品をどう書くか
- `Next.js`: その UI 部品をどう配置し、Web アプリとして動かすか

この 2 つは密接ですが、見る観点は少し違います。  
ただし、このリポジトリのような Web 側の実装では一緒に読む方が理解しやすい場面が多いです。

## このリポジトリでの役割

- `React`
  - JSX を使って UI を書く
  - props を受け取り、値を表示する
- `Next.js`
  - `src/app` 配下の構成で URL と画面を結びつける
  - 開発サーバーやビルドの土台になる
  - 共有 package を使うための設定を持つ

## 役割の切り分け

### React で見るもの

- `component`
- `props`
- JSX
- 配列の描画
- 値の受け渡し

### Next.js で見るもの

- `page.tsx`
- `layout.tsx`
- `app router`
- `next.config.ts`
- 環境変数の読み込み

## キーワード

- `component`: 画面部品
- `props`: 親から子へ渡す値
- JSX: JavaScript の中に HTML 風構文を書くもの
- `page.tsx`: その URL で表示される画面
- `layout.tsx`: 複数画面で共有する枠
- `transpilePackages`: workspace 内 package を Next.js 側で変換対象に含める設定

## よく使う構文

### React コンポーネント

```tsx
export default function HomePage() {
  return <h1>トップページ</h1>
}
```

### props を受け取る

```tsx
type MessageProps = {
  text: string
}

function Message({ text }: MessageProps) {
  return <p>{text}</p>
}
```

### 値を埋め込む

```tsx
const title = 'sportsfest2026'

return <h1>{title}</h1>
```

### 配列を表示する

```tsx
const items = ['赤', '青', '黄']

return (
  <ul>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
)
```

### Next.js のページ

```tsx
export default function HomePage() {
  return <main>hello</main>
}
```

### Next.js のレイアウト

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
```

### Next.js の設定

```ts
const nextConfig = {
  transpilePackages: ['@sportsfest/shared']
}

export default nextConfig
```

### Web 側の環境変数を読む

```ts
export const webEnv = webEnvSchema.parse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL
})
```

## 実務で意識すること

- JSX や props の理解は React の話として押さえる
- `page.tsx` や `layout.tsx` の置き場所は Next.js の話として押さえる
- UI 部品の設計と、アプリのファイル配置や設定は分けて考える
- ただし実装時は両方を同時に触ることが多い

## このプロジェクトでまず見る場所

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/layout.tsx`
- `apps/web/next.config.ts`
