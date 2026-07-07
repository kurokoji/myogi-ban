# アーキテクチャ

## 概要

FightStick Viewerは、サーバー・クライアントアーキテクチャを採用しています。

```
┌─────────────────┐
│  Browser (Editor)│ ← 設定画面
└────────┬────────┘
         │ HTTP API
         ↓
┌─────────────────┐
│   Node.js Server│ ← Express + WebSocket
│  (port 33770)   │
└────────┬────────┘
         │ WebSocket
         ↓
┌─────────────────┐
│ Browser (Viewer)│ ← OBS表示用
└─────────────────┘
```

## コンポーネント

### サーバー (server.ts)

Express + WebSocketサーバー。以下の機能を提供：

- **静的ファイル配信**: HTML, CSS, JS, 画像
- **REST API**: レイアウトのCRUD、画像アップロード
- **WebSocket**: ゲームパッド状態のリアルタイム配信

#### APIエンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/` | 編集画面 |
| GET | `/view` | ビューア画面 |
| GET | `/api/layouts` | レイアウト一覧 |
| GET | `/api/layout/:name` | レイアウト取得 |
| POST | `/api/layout/save` | レイアウト保存 |
| POST | `/api/upload-image` | 画像アップロード |
| POST | `/api/state` | ゲームパッド状態送信 |
| GET | `/api/state` | 現在の状態取得 |

### 編集画面 (editor.ts)

TypeScriptで実装された設定画面。以下のクラスで構成：

- **EditorApp**: メインアプリケーションクラス
- **GamepadManager**: ゲームパッドの入力管理
- **Renderer**: レイアウトの描画
- **ApiClient**: サーバーAPIとの通信

### ビューア (viewer.ts)

OBS表示用の軽量クライアント。

- **ViewerApp**: メインアプリケーションクラス
- **GamepadManager**: ゲームパッドの入力管理
- **Renderer**: レイアウトの描画
- **ApiClient**: サーバーAPIとの通信

## データフロー

### 編集画面での設定

```
1. ユーザーが設定を変更
   ↓
2. EditorAppが状態を更新
   ↓
3. Rendererがプレビューを更新
   ↓
4. 「Save」ボタンでサーバーに送信
   ↓
5. サーバーがlayout.jsonとして保存
   ↓
6. 「Set as Default」でdefaultレイアウトも更新
```

### ビューアでの表示

```
1. ビューアが起動
   ↓
2. デフォルトレイアウトを読み込み
   ↓
3. GamepadManagerがゲームパッドを監視
   ↓
4. 入力検出時に状態を更新
   ↓
5. Rendererが描画を更新
   ↓
6. 状態をサーバーに送信（オプション）
```

## レイアウトシステム

### レイアウトデータ構造

```typescript
interface Layout {
  version: string;              // バージョン
  name: string;                 // レイアウト名
  totalbuttonshow: number;      // 表示ボタン数
  showstick: boolean;           // スティック表示
  stick: StickLayout;           // スティック設定
  defaultbuttons: ButtonLayout; // デフォルトボタン設定
  buttons: ButtonLayout[];      // 各ボタン設定
  background: BackgroundConfig; // 背景設定
  inputhistorymode: InputHistoryMode; // 入力履歴設定
  buttonMappings?: number[];    // ボタンマッピング
  stickMappings?: number[];     // スティックマッピング
}
```

### レイアウトファイル

- **保存形式**: JSON
- **保存場所**: `public/layout/{name}/layout.json`
- **デフォルトレイアウト**: `public/layout/default/layout.json`

### 画像ファイル

- **保存場所**: `public/layout/{name}/`
- **対応形式**: PNG, JPG, GIF, WebP
- **アップロード方法**: Base64エンコードしてPOST

## ゲームパッド処理

### GamepadManager

Web Gamepad APIを使用してゲームパッドの入力を管理：

- **接続検出**: `gamepadconnected`イベント
- **切断検出**: `gamepaddisconnected`イベント
- **ポーリング**: `requestAnimationFrame`で状態を取得
- **ボタン検出**: `gamepad.buttons[].pressed`
- **軸検出**: `gamepad.axes[]`（アナログスティック）

### ボタンマッピング

```typescript
// ボタンマッピングの例
buttonMappings = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
// 各インデックスがゲームパッドのボタン番号に対応
```

### スティックマッピング

```typescript
// スティックマッピングの例
stickMappings = [12, 13, 14, 15]
// 0: 上, 1: 下, 2: 左, 3: 右
// 各値がゲームパッドのボタン番号に対応
```

## 描画システム

### Renderer

CSSとDOM操作を使用してレイアウトを描画：

- **動的スタイル生成**: `<style>`タグを動的に生成
- **ボタン描画**: 絶対位置で配置
- **スティック描画**: 回転transformで方向を表現
- **背景描画**: 背景画像の設定

### スタイル優先順位

1. インラインスタイル（最優先）
2. 動的生成スタイル
3. 静的CSSファイル

## ビルドシステム

### esbuild

高速なTypeScriptコンパイラ＆バンドラー：

- **サーバー**: Node.js向けにバンドル
- **エディタ**: ブラウザ向けにバンドル
- **ビューア**: ブラウザ向けにバンドル

### ビルドコマンド

```bash
# 全ビルド
npm run build

# 個別ビルド
npm run build:server   # dist/server.js
npm run build:editor   # public/js/editor.js
npm run build:viewer   # public/js/viewer.js
```

## プロセス管理

### PIDファイル

- **保存場所**: `server.pid`
- **内容**: サーバーのプロセスID
- **用途**: `npm stop`でプロセスを終了

### 終了処理

```
SIGTERM/SIGINT受信
  ↓
サーバーをクローズ
  ↓
プロセス終了
```

## 拡張性

### 新しい機能の追加

1. **型定義**: `types.ts`にインターフェースを追加
2. **API**: `server.ts`にエンドポイントを追加
3. **クライアント**: `editor.ts`/`viewer.ts`にロジックを追加
4. **UI**: `index.html`/`view.html`に要素を追加

### カスタムレイアウト

- `layout.ts`の`createDefaultLayout()`を拡張
- `renderer.ts`の描画ロジックを更新
- CSSファイルにスタイルを追加

## トラブルシューティング

### ポートが使用中

```bash
# プロセスを確認
lsof -i :33770

# プロセスを終了
kill -9 <PID>
```

### ゲームパッドが認識されない

1. ブラウザがGamepad APIをサポートしているか確認
2. ゲームパッドのボタンを押して接続をトリガー
3. ブラウザの開発者ツールで`navigator.getGamepads()`を確認

### レイアウトが反映されない

1. 「Set as Default」ボタンを押したか確認
2. ビューアをリロード
3. サーバーのログを確認
