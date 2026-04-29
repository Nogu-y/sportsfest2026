# Docker Compose

## 何に使うか

複数のコンテナをまとめて起動・停止するために使います。  
実務では、ローカル環境の差を減らすためによく使われます。

## このリポジトリでの役割

- `api` コンテナを起動する
- `db` コンテナを起動する
- 開発時の API と DB の組み合わせを固定する

## キーワード

- `service`: Compose 上の名前。ここでは `api` と `db`
- `container`: 実際に起動される単位。`down` で消える
- `image`: コンテナの土台
- `volume`: Docker 管理の永続データ置き場
- `bind mount`: ホストの実ディレクトリをそのまま見せる仕組み

このリポジトリでは `./apps/db/data:/var/lib/postgresql/data` は bind mount、`pnpm-store:/pnpm/store` は named volume です。

## よく見る設定

### サービス定義

```yml
services:
  db:
    image: postgres:16-alpine
```

### 環境変数ファイル

```yml
env_file:
  - ./apps/api/.env
```

### ボリューム

```yml
volumes:
  - ./apps/db/data:/var/lib/postgresql/data
```

### named volume

```yml
volumes:
  - pnpm-store:/pnpm/store
```

## 実務で意識すること

- `down` はコンテナ削除まで行う
- volume と bind mount はデータ保持の意味が違う
- 環境変数の参照元を把握しておく
- `ports` は `ホスト:コンテナ` の順で読む

## このプロジェクトでまず見る場所

- `docker-compose.yml`
- `package.json`
