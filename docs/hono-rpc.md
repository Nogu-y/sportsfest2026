# RPC（honoRPC）導入ガイド

## 概要

Frontend から Backend の API を **型安全（Type Safe）** に呼び出せるように、`honoRPC` を導入しました。

これにより、

* エンドポイント名の打ち間違いを防げる
* 存在しないメソッド（GET / POST など）を呼べない
* リクエストの型・レスポンスの型が補完される
* API 変更時にコンパイルエラーで気づける

といったメリットがあります。

簡単にいうと、

> **「文字列で API パスを書く」のをやめて、型付きの関数として API を呼ぶ**

という仕組みです。

---

## 基本的な使い方

### import

まず client を import します。

```ts
import { api } from 'src/lib/api/client'
```

この `api` に、Backend で定義したエンドポイントが生えています。

---

## GET の呼び出し例

例えば `/health` の GET API がある場合：

```ts
const response = await api.health.$get()
const data = await response.json()
```

これで API を呼べます。

### 何をしているか

```ts
api.health
```

→ `/health` エンドポイントを指定

```ts
.$get()
```

→ GET メソッドで呼ぶ

```ts
await response.json()
```

→ レスポンスを JSON として取得

---

## 従来との違い

以前：

```ts
const response = await fetch('/health')
const data = await response.json()
```

問題点：

* URL を文字列で書くので typo しやすい
* API が消えても気づきにくい
* request / response の型が弱い

---

honoRPC：

```ts
const response = await api.health.$get()
const data = await response.json()
```

メリット：

* typo 防止
* IDE 補完が効く
* 型が追える
* エンドポイント変更時に壊れている箇所が分かる

---

# パラメータ付き API の呼び方

## Query Parameter

例：

```ts
GET /users?page=1
```

呼び出し：

```ts
const response = await api.users.$get({
  query: {
    page: '1',
  },
})

const data = await response.json()
```

---

## Path Parameter

例：

```ts
GET /users/:id
```

呼び出し：

```ts
const response = await api.users[':id'].$get({
  param: {
    id: '123',
  },
})

const data = await response.json()
```

---

## POST

例：

```ts
POST /users
```

呼び出し：

```ts
const response = await api.users.$post({
  json: {
    name: 'Taro',
    age: 20,
  },
})

const data = await response.json()
```

---

# API 側の実装ルール（重要）

## 必ずすべてのメソッドをチェーンでつなぐこと

ここは **かなり重要** です。

honoRPC は、最終的に export される `Hono` インスタンスの型情報を見て RPC 用の型を生成します。
そのため、

> **`.get()` / `.post()` などをチェーンでつないだ形で定義されている必要があります。**

この書き方になっていないと、**エンドポイントが存在していても RPC 側から見えません。**

---

## OK例

```ts
const app = new Hono()
  .get('/', (c) => {
    return c.text('hello')
  })
  .get('/health', (c) => {
    return c.json({ ok: true })
  })
```

このように、

```ts
new Hono()
  .get(...)
  .get(...)
  .post(...)
```

のような **メソッドチェーン形式** で定義してください。

この形であれば honoRPC が型を正しく読み取り、

```ts
api.index.$get()
api.health.$get()
```

のように Frontend 側から型安全に呼べるようになります。

---

## NG例①：インスタンスだけ作って export する

```ts
const health = new Hono()

export default health
```

これは **RPC に反映されません。**

理由はシンプルで、この時点では

* どの path があるのか
* どの method があるのか

が型として確定していないためです。

---

## NG例②：後からメソッドを生やす

```ts
const route = new Hono()

route.get('/health', (c) => {
  return c.json({ ok: true })
})
```

これも **RPC に反映されません。**

一見 `.get()` を使っているので問題なさそうに見えますが、
**後から mutate（追加）する書き方** では honoRPC が型をうまく拾えません。

重要なのは、

> **`.get()` した結果をチェーンとして持ったまま export されること**

です。

---

## なぜチェーンが必要なのか

Hono の `.get()` や `.post()` は、**route 情報を持った新しい型** を返します。

つまり、

```ts
const app = new Hono()
```

この時点の型はただの空の Hono。

↓

```ts
const app = new Hono().get('/health', handler)
```

ここで初めて

> 「`/health` に GET がある」

という型情報を持った Hono になります。

さらに

```ts
const app = new Hono()
  .get('/health', handler)
  .post('/users', handler)
```

とチェーンすると、

> 「`/health(GET)` と `/users(POST)` がある」

という型情報が積み上がっていきます。

honoRPC はこの最終的な型を見ています。

---

## route() を使う場合の注意

```ts
const route = new Hono()

route.route('/health', healthRoute)
```

この場合も、`healthRoute` 側がチェーン形式で定義されている必要があります。

例：

```ts
const healthRoute = new Hono()
  .get('/', (c) => c.json({ ok: true }))
```

これは OK。

逆に：

```ts
const healthRoute = new Hono()

healthRoute.get('/', (c) => c.json({ ok: true }))
```

これは NG。

見た目は似ていますが、RPC の型生成結果は変わります。

---

## まとめ

API 側では必ずこの形で書いてください。

```ts
const app = new Hono()
  .get(...)
  .post(...)
  .put(...)
  .delete(...)
```

**ポイントは「メソッドを書くこと」ではなく、
「メソッドチェーンとしてつないだ状態を export すること」です。**

ここを守らないと、Frontend 側の

```ts
api.xxx.$get()
```

に endpoint が出てこなくなります。

## イメージ

これは未完成：

```ts
api.users
```

これは完成：

```ts
api.users.$get()
```

Backend 側も同じで、

これは未完成：

```ts
new Hono()
```

これは完成：

```ts
new Hono().get(...)
```

**メソッドまで生えて初めて RPC の型になる**
と覚えてください。

---

# 開発時の確認方法

IDE の補完を見るのが一番早いです。

```ts
api.
```

まで打つと endpoint 一覧が出ます。

さらに

```ts
api.users.
```

まで打つと

* `$get`
* `$post`

など使えるメソッドが出ます。

出ない場合は Backend 側の route 定義を確認してください。

大抵、

> **HTTP メソッドまでチェーンできていない**

のが原因です。

---

# まとめ

覚えることはこの 2 つだけです。

## Frontend

```ts
const response = await api.health.$get()
const data = await response.json()
```

**`api.{endpoint}.$method()` で呼ぶ**

---

## Backend

```ts
new Hono().get(...)
```

**HTTP メソッドまで必ずチェーンする**

---

これだけ守れば、型安全に API を扱えます。
