# FightStick Viewer

格闘ゲームコントローラーの入力を可視化するWebアプリケーションです。OBSのブラウザソースとして使用できます。

## 特徴

- 🎮 リアルタイム入力表示
- 🎨 カスタマイズ可能なレイアウト
- 💾 レイアウトの保存・読み込み
- 📺 OBSブラウザソース対応
- 🌐 ブラウザベース（Electron不要）

## インストール

```bash
npm install
```

## 使い方

### サーバー起動

```bash
npm start
```

サーバーが起動したら、ブラウザで以下にアクセス：

- **編集画面**: http://localhost:33770
- **OBS用ビューア**: http://localhost:33770/view

### サーバー停止

```bash
npm stop
```

### OBS設定

1. OBSで「ブラウザソース」を追加
2. URLに `http://localhost:33770/view` を入力
3. 幅: 500、高さ: 250 に設定
4. 「OK」をクリック

## 機能

### 基本機能

- **スティック表示**: 8方向の入力を視覚的に表示
- **ボタン表示**: 最大48ボタンまで対応
- **入力履歴**: 入力したコマンドを履歴として表示
- **デフォルトレイアウト**: 起動時に読み込むレイアウトを設定

### カスタマイズ

- **背景画像**: 独自画像の使用
- **スティック位置**: 位置・サイズの変更
- **ボタン配置**: 各ボタンの位置・サイズ・画像を個別設定
- **ボタンマッピング**: ゲームパッドのボタン割り当て

### レイアウト管理

- **保存**: 現在の設定を名前付きで保存
- **読み込み**: 保存したレイアウトを読み込み
- **デフォルト設定**: 起動時に読み込むレイアウトを設定

## ビルド

```bash
# 全ビルド
npm run build

# 個別ビルド
npm run build:server
npm run build:editor
npm run build:viewer
```

## 技術スタック

- **Backend**: Node.js + Express + WebSocket
- **Frontend**: TypeScript
- **Build Tool**: esbuild
- **Gamepad API**: Web Gamepad API

## ファイル構成

```
fightstick-viewer/
├── src/                    # ソースコード
│   ├── server.ts          # サーバー
│   ├── editor.ts          # 編集画面
│   ├── viewer.ts          # ビューア
│   ├── types.ts           # 型定義
│   ├── layout.ts          # レイアウト管理
│   ├── gamepad.ts         # ゲームパッド管理
│   ├── renderer.ts        # 描画処理
│   ├── api.ts             # APIクライアント
│   └── dom.ts             # DOM操作
├── public/                 # 静的ファイル
│   ├── index.html         # 編集画面HTML
│   ├── view.html          # ビューアHTML
│   ├── css/               # スタイルシート
│   ├── js/                # ビルド済みJS
│   └── layout/            # レイアウトファイル
├── dist/                   # ビルド成果物
└── docs/                   # ドキュメント
```

## ライセンス

MIT
