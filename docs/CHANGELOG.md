# 変更履歴

## [1.0.0] - 2026-07-07

### 変更
- フロントエンドをReact + TypeScriptへ移行
- Mantineを導入
- i18next/react-i18nextによる日本語/英語切り替えを追加

### 追加
- 初期リリース
- TypeScriptベースの実装
- ブラウザベースのアーキテクチャ（Electron不要）
- リアルタイムゲームパッド入力表示
- カスタマイズ可能なレイアウト
- レイアウトの保存・読み込み機能
- デフォルトレイアウト設定
- OBSブラウザソース対応
- ボタンマッピング機能
- 入力履歴機能（垂直/水平/同時押しモード）
- 画像アップロード機能
- PIDファイルによるプロセス管理
- npm start/stopコマンド

### 技術的変更
- Electron → ブラウザベースに変更
- JavaScript → TypeScriptに移行
- モジュール分割（server, editor, viewer, types, layout, gamepad, api, React components）
- esbuildによる高速ビルド
- Express + WebSocketサーバー
- REST API実装

### 機能
- スティック表示（8方向）
- ボタン表示（最大48ボタン）
- 背景画像カスタマイズ
- スティック位置・サイズ調整
- ボタン個別設定
- ボタンマッピング（クリック割り当て、軸ホールド割り当て）
- 入力履歴（垂直/水平/同時押しモード）
- スケール・透明度調整
- レイアウト保存・読み込み
- デフォルトレイアウト設定

### ドキュメント
- README.md: プロジェクト概要、インストール、使い方
- ARCHITECTURE.md: アーキテクチャ、データフロー
- FEATURES.md: 機能一覧
- API.md: APIリファレンス
- CHANGELOG.md: 変更履歴
