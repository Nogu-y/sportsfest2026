# ドキュメント一覧

このディレクトリには、`sportsfest2026` の詳細ドキュメントをまとめています。  
トップの [README](../README.md) は入口、こちらは用途別の詳細資料という位置づけです。

## 一覧

- [セットアップ手順](./setup.md)
  - ローカル開発環境の準備、環境変数、起動確認
- [アーキテクチャ概要](./architecture.md)
  - モノレポ構成、アプリ間の責務、依存関係
- [開発ガイド](./development.md)
  - 日常的な開発フロー、ファイル追加時の考え方、運用ルール
- [データベースと Drizzle](./database.md)
  - PostgreSQL、スキーマ定義、マイグレーション関連
- [スコア計算ロジック](./score-calculation.md)
  - `POST /api/staff/events/:eventId/score` の入出力、計算フロー、失敗条件
- [初心者向けガイド](./study/README.md)
  - 技術スタックの概要、学習用資料、チュートリアル

## 読み方の目安

- 初めて触る場合: `setup.md` → `architecture.md`
- 開発に不慣れな場合: `study/README.md` → `study/command-cheatsheet.md`
- 実装を始める場合: `development.md`
- DB 変更を行う場合: `database.md`
