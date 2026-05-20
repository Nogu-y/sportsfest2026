# Push通知 検証手順書

生成日: 2026-05-20

対象API: `https://sportsfest-api.ichinoseki.ac.jp`

対象Webアプリ: メンバーに共有された本番WebアプリURLを使用してください。

この手順書の目的:

- 利用者が通知を有効化できるか確認する
- ウォッチリスト登録がサーバーに保存されるか確認する
- 試合開始前リマインド通知が実際に届くか確認する
- 通知をタップしたときに対象試合詳細へ遷移するか確認する

## 先に知っておく仕様

通知は次の条件をすべて満たしたときに送信されます。

- 対象者がPush通知を有効化済み
- 対象者がその試合をウォッチリストに登録済み
- 試合の `scheduledStartTime` が、通知処理実行時点の5分後から10分後まで
- 試合の `status` が `Waiting`
- 同じ利用者・同じ試合に対して、まだ通知送信ログがない

APIサーバー側では毎分 `sendMatchReminders` が実行されます。つまり、時刻を正しく合わせても通知到着まで最大1分程度かかります。

重要:

- 同じ端末・同じ試合では基本的に1回しか通知されません。再テストするときは別の試合を使ってください。
- 試合が `Preparing`, `Playing`, `Finished`, `Completed`, `Cancelled` になっていると通知されません。
- 現時点の実装では、一覧カード左上のウォッチリストアイコンは表示用です。ウォッチリスト登録は、試合詳細画面を開いて上部のアイコンから行ってください。
- iPhone / iPad は、ブラウザタブのままではWeb Pushが動かないことがあります。ホーム画面に追加したPWAとして開いて確認してください。

## 役割分担

最低3人で確認できます。5人いると端末差分も見やすいです。

| 役割 | 人数 | 作業 |
| --- | ---: | --- |
| 管理者 | 1 | テスト対象試合の時刻を `現在+7分` に変更し、必要なら `Waiting` に戻す |
| 通知確認者 | 2〜4 | 各自の端末で通知許可、ウォッチリスト登録、通知受信確認 |
| 記録係 | 1 | 端末名、ブラウザ、通知可否、到着時刻、タップ遷移可否を記録 |

1人が複数役を兼ねても構いません。

## 推奨端末

次のうち、用意できるものを使ってください。

| 端末 | 優先度 | 備考 |
| --- | --- | --- |
| Android Chrome | 高 | Web Push確認に向いています |
| Windows / macOS Chrome | 高 | DevToolsでUUID確認もしやすいです |
| iPhone Safari PWA | 中 | 必ずホーム画面に追加してから確認してください |
| iPhone Safari 通常タブ | 低 | 通知が出ない可能性があります |

## テスト対象試合

まずはソフトボールの未開始試合を使うのが分かりやすいです。

| 用途 | matchId | 試合 | 会場 | 対戦 |
| --- | ---: | --- | --- | --- |
| 通知テスト1回目 | 94 | ① | 野球グラウンド A | 1-2 vs 5E |
| 通知テスト2回目 | 95 | ② | 野球グラウンド B | 5J vs 教職員 |
| 予備 | 98 | ③ | 野球グラウンド A | 2C vs 5C |
| 予備 | 101 | ④ | 野球グラウンド B | 4M vs 3E |

同じ端末で再通知を確認したい場合は、同じ `matchId` を使わず、次の予備試合に進んでください。

## 全体の流れ

1. 通知確認者がWebアプリを開く。
2. 通知確認者が通知を有効化する。
3. 通知確認者が対象試合をウォッチリストに登録する。
4. 管理者が対象試合の開始予定を `現在+7分` に変更する。
5. 管理者が対象試合の状態が `Waiting` であることを確認する。
6. 5〜10分前の範囲に入ったら、通知を待つ。
7. 通知が届いたら、通知本文とタップ遷移を確認する。
8. `/api/public/master` でウォッチリスト対象試合やステータスの整合を確認する。

## 通知確認者の手順

### 1. 事前準備

1. 端末の通知設定で、使用するブラウザまたはPWAの通知がブロックされていないことを確認する。
2. Webアプリを開く。
3. iPhoneの場合は、Safariで開いたあとホーム画面に追加し、ホーム画面のアイコンから起動する。
4. ページ下部またはホーム画面上の `通知設定` を探す。

### 2. 通知を有効化する

1. `試合速報のプッシュ通知をオンにする` を押す。
2. ブラウザまたはOSの通知許可ダイアログで `許可` を選ぶ。
3. アプリ上で `試合状況のプッシュ通知を有効にしました！` のような表示が出ることを確認する。

失敗した場合:

- ブラウザのサイト設定で通知が `ブロック` になっていないか確認する。
- iPhoneの場合、通常タブではなくホーム画面追加済みPWAから開いているか確認する。
- 会社・学校のネットワークで通知が制限されていないか確認する。

### 3. UUIDを控える

後でサーバー側のウォッチリスト確認に使います。PCならDevTools Consoleで次を実行します。

```js
localStorage.getItem("sportsfest_user_uuid")
```

スマホでDevToolsが使えない場合は、記録係は「端末名」と「登録した試合ID」だけ控えてください。

### 4. 対象試合をウォッチリストに登録する

1. `開催予定` の試合一覧を開く。
2. 対象試合を探す。例: ソフトボール `1-2 vs 5E`、試合 `①`。
3. 試合カードをタップして詳細画面を開く。
4. 詳細画面上部のウォッチリストアイコンを押す。
5. アイコンが登録済み表示に変わることを確認する。
6. 可能ならウォッチリスト一覧を開き、対象試合が表示されることを確認する。

注意:

- 試合一覧カード左上のアイコンでは登録できない可能性があります。必ず詳細画面で押してください。

### 5. サーバー登録確認

UUIDが分かる場合、次のURLで確認できます。

```text
https://sportsfest-api.ichinoseki.ac.jp/api/public/watchlist?uuid=ここにUUID
```

期待結果:

```json
{
  "uuid": "各端末のUUID",
  "matchPlanIds": [94]
}
```

複数試合を登録した場合は、`matchPlanIds` に複数IDが入ります。

### 6. 通知を待つ

管理者から「開始予定を現在+7分に変更した」と連絡を受けたら、端末を次の状態にしてください。

- 画面ロック状態
- または別アプリを開いた状態
- またはブラウザ/PWAをバックグラウンドにした状態

期待される通知:

```text
タイトル: 試合開始まであとX分！
本文: 【1-2 vs 5E】ソフトボール 本選トーナメント がまもなく開始します (①)
```

`X` は実行タイミングにより5〜10の範囲で変わります。

### 7. 通知タップ確認

1. 通知をタップする。
2. Webアプリが開くことを確認する。
3. `/match/94` のような対象試合詳細に移動することを確認する。
4. 試合名、対戦、会場が対象試合と一致することを確認する。

## 管理者の手順

管理者は、通知確認者がウォッチリスト登録を完了してから実施してください。

### 1. 対象試合を確認する

PowerShell:

```powershell
$master = Invoke-RestMethod -Uri https://sportsfest-api.ichinoseki.ac.jp/api/public/master
$master.matches | Where-Object { $_.id -eq 94 } | ConvertTo-Json -Depth 10
```

確認する値:

- `status` が `Waiting`
- `participants.teamId` が両方 `null` ではない
- `scheduledStartTime` は後で変更するため、現在値は控える

### 2. 時刻変更の考え方

通知処理は「現在から5〜10分後に開始するWaiting試合」を探します。

そのため、テストでは対象試合の `scheduledStartTime` を `現在+7分`、`scheduledEndTime` を `現在+37分` などに変更します。

例:

- 現在が `2026-05-20 21:30 JST`
- `scheduledStartTime` は `2026-05-20T21:37:00+09:00`
- `scheduledEndTime` は `2026-05-20T22:07:00+09:00`

### 3. 管理画面から変更する場合

1. 管理画面にADMINでログインする。
2. `データコントロール` を開く。
3. `試合` を選ぶ。
4. 編集対象イベントブロックで `ソフトボール / 本選トーナメント` を選ぶ。
5. `matchId=94` を探し、編集する。
6. `status` を `Waiting` にする。
7. `開始予定` を現在+7分にする。
8. `終了予定` を開始予定+30分程度にする。
9. 更新する。
10. 通知確認者に「変更完了」と連絡する。

### 4. APIから変更する場合

ADMINのログインCookieが必要です。Cookieを取得済みの場合の例です。

```powershell
$cookie = "sportsfest_session=..."
$start = (Get-Date).AddMinutes(7).ToString("yyyy-MM-ddTHH:mm:00zzz")
$end = (Get-Date).AddMinutes(37).ToString("yyyy-MM-ddTHH:mm:00zzz")

$body = @{
  status = "Waiting"
  scheduledStartTime = $start
  scheduledEndTime = $end
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri https://sportsfest-api.ichinoseki.ac.jp/api/admin/matches/94 `
  -Method Put `
  -Headers @{ Cookie = $cookie } `
  -ContentType "application/json" `
  -Body $body
```

変更後確認:

```powershell
$master = Invoke-RestMethod -Uri https://sportsfest-api.ichinoseki.ac.jp/api/public/master
$master.matches | Where-Object { $_.id -eq 94 } | Select-Object id,status,scheduledStartTime,scheduledEndTime
```

## 成功判定

以下を満たせば、通知機能の主要経路は成功です。

| 観点 | 成功条件 |
| --- | --- |
| 通知許可 | 各端末で通知許可ができる |
| サブスクリプション登録 | 通知ON後にエラーが出ない |
| ウォッチリスト登録 | `/api/public/watchlist?uuid=...` に対象 `matchId` が入る |
| 通知送信 | 開始5〜10分前の範囲で通知が届く |
| 通知内容 | タイトルが `試合開始まであとX分！`、本文に対戦名・競技名・試合名が入る |
| タップ遷移 | 通知タップで対象の `/match/{matchId}` が開く |
| 重複防止 | 同じ端末・同じ試合で通知が何度も届かない |

## 記録テンプレート

検証時は次の表をコピーして使ってください。

| No | 担当者 | 端末 | OS | ブラウザ/PWA | matchId | UUID控え | 通知許可 | ウォッチ登録 | 通知到着時刻 | 通知本文OK | タップ遷移OK | 備考 |
| ---: | --- | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  | 94 |  | OK / NG | OK / NG |  | OK / NG | OK / NG |  |
| 2 |  |  |  |  | 94 |  | OK / NG | OK / NG |  | OK / NG | OK / NG |  |
| 3 |  |  |  |  | 95 |  | OK / NG | OK / NG |  | OK / NG | OK / NG |  |

## 追加シナリオ

### シナリオA: 複数人が同じ試合を登録

目的:

- 1つの試合に対して、複数端末へ通知が届くか確認する。

手順:

1. 全員が `matchId=94` をウォッチリスト登録する。
2. 管理者が `matchId=94` を現在+7分にする。
3. 全員に通知が届くか確認する。

成功条件:

- 登録した端末すべてに通知が届く。
- 未登録の端末には届かない。

### シナリオB: 登録解除した人には届かない

目的:

- ウォッチリスト削除が通知対象から外れるか確認する。

手順:

1. Aさん、Bさんが `matchId=95` を登録する。
2. Bさんだけ詳細画面からウォッチリストを解除する。
3. BさんのUUIDで `/api/public/watchlist?uuid=...` を開き、`95` が消えていることを確認する。
4. 管理者が `matchId=95` を現在+7分にする。
5. Aさんに届き、Bさんに届かないことを確認する。

成功条件:

- Aさんには通知が届く。
- Bさんには通知が届かない。

### シナリオC: Waiting以外では届かない

目的:

- `status=Waiting` 条件が効いているか確認する。

手順:

1. Aさんが `matchId=98` を登録する。
2. 管理者が `matchId=98` の開始予定を現在+7分にする。
3. 管理者が `matchId=98` の `status` を `Preparing` または `Playing` にする。
4. 10分待つ。

成功条件:

- 通知が届かない。

注意:

- このシナリオ後、手入力テストに進む場合は試合状態を意図した状態へ戻してください。

## トラブルシュート

### 通知ONボタンが出ない

考えられる原因:

- ブラウザがPush通知に対応していない。
- iPhoneでPWAとして起動していない。
- 既に通知ONになっている。

確認:

```js
"serviceWorker" in navigator
"PushManager" in window
Notification.permission
localStorage.getItem("sportsfest_push_enabled")
```

### 通知許可したのにウォッチリストがサーバーにない

確認:

```js
localStorage.getItem("sportsfest_user_uuid")
localStorage.getItem("sportsfest_local_watchlist")
localStorage.getItem("sportsfest_push_enabled")
```

次に、UUIDで確認:

```text
https://sportsfest-api.ichinoseki.ac.jp/api/public/watchlist?uuid=UUID
```

`404` の場合は、サブスクリプション登録に失敗している可能性があります。もう一度通知ONを実行するか、別ブラウザで確認してください。

### 時刻を合わせたのに通知が来ない

確認項目:

- 対象試合がウォッチリストに入っているか
- 対象試合の `status` が `Waiting` か
- `scheduledStartTime` が現在から5〜10分後か
- 既に同じ端末・同じ試合で通知済みではないか
- 端末側で通知がOSレベルでブロックされていないか
- ブラウザ/PWAが省電力モードで通知を止めていないか

PowerShellで対象試合を確認:

```powershell
$master = Invoke-RestMethod -Uri https://sportsfest-api.ichinoseki.ac.jp/api/public/master
$master.matches | Where-Object { $_.id -eq 94 } | Select-Object id,status,scheduledStartTime
```

### 通知は来たが、タップしても試合詳細に行かない

期待される遷移先は `/match/{matchId}` です。

確認項目:

- 通知本文の対象試合IDと、開いたURLが一致しているか
- PWAで開いた場合に既存ウィンドウへフォーカスしていないか
- 別タブで開いた場合、URLが `/match/94` のようになっているか

## 検証後に戻すもの

通知テストで試合予定時刻や状態を変更した場合、次のどちらかを行ってください。

- バックアップから戻す
- 管理画面で対象試合の `scheduledStartTime`, `scheduledEndTime`, `status` を元に戻す

今回の通知テストで特に戻す可能性が高い試合:

| matchId | 試合 |
| ---: | --- |
| 94 | ソフトボール ① |
| 95 | ソフトボール ② |
| 98 | ソフトボール ③ |
| 101 | ソフトボール ④ |
