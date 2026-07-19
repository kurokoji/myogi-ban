# アーキテクチャ

## 概要

Myogi BanはローカルHTTPサーバー、編集画面、OBSビューアで構成されます。Electron起動時も内部では同じExpressサーバーを起動し、Electronウィンドウで編集画面を開きます。

```text
┌──────────────────┐
│ Editor           │
│ React + Mantine  │
└────────┬─────────┘
         │ REST API
         v
┌──────────────────┐
│ Express Server   │
│ port 33770       │
└────────┬─────────┘
         │ HTTP
         v
┌──────────────────┐
│ OBS Viewer       │
│ React            │
└──────────────────┘
```

## エントリポイント

- `src/electron.ts`: Electronアプリ起動用。Express/WebSocketサーバーを起動し、本番はExpress、開発時はVite Rendererの編集画面をBrowserWindowで開く
- `src/server.ts`: Webサーバー単体起動用。Express/WebSocketサーバーだけを起動する
- `src/local-server.ts`: Electron/Webサーバーで共有するExpress API、静的配信、WebSocket、レイアウト保存処理
- `src/editor.tsx`: 編集画面のReactエントリ
- `src/viewer.tsx`: OBSビューアのReactエントリ

## サーバー

Expressサーバーは以下を提供します。

| メソッド | パス | 説明 |
| --- | --- | --- |
| GET | `/` | 編集画面 |
| GET | `/view` | OBSビューア |
| GET | `/api/layouts` | レイアウト一覧 |
| GET | `/api/layout/:name` | レイアウト取得 |
| POST | `/api/layout/save` | レイアウト保存 |
| POST | `/api/upload-image` | 画像アップロード |
| POST | `/api/state` | 入力状態送信 |
| GET | `/api/state` | 直近の入力状態取得 |
| GET | `/api/default-layout` | デフォルトレイアウト取得 |
| POST | `/api/default-layout` | デフォルトレイアウト保存 |

WebSocketは同じポートで待ち受け、`POST /api/state` された状態を `{ type: "state", data }` として配信します。

## クライアント

### 編集画面

`EditorApp` がレイアウト編集、ゲームパッド入力監視、保存/読み込み、割り当て操作を担当します。

主要な依存モジュール:

- `ApiClient`: REST API呼び出し
- `GamepadManager`: Gamepad APIの接続、ポーリング、ボタン/軸検出
- `GamepadView`: 背景、レバー、ボタンの描画
- `local-server.ts`: ローカルサーバーの共通実装
- `layout.ts`: デフォルトレイアウト生成と既存JSONへのデフォルト補完
- `i18n.ts`: 日本語/英語リソース

### OBSビューア

`ViewerApp` はデフォルトレイアウトを読み込み、Gamepad APIから直接入力状態を読んで描画します。OBSのブラウザソースで使うことを想定した軽量画面です。

## レイアウトデータ

```typescript
interface Layout {
  version: string;
  name: string;
  totalbuttonshow: number;
  showstick: boolean;
  stick: StickLayout;
  defaultbuttons: ButtonLayout;
  buttons: ButtonLayout[];
  background: BackgroundConfig;
  guides: { vertical: number[]; horizontal: number[] };
  buttonMappings?: number[];
  stickMappings?: number[];
}
```

`ensureLayoutDefaults()` が古い/不足したレイアウトJSONに対して現在のデフォルト値を補完します。
CSS描画ボタンは `cssShape` で `"circle"`、`"rounded"`、`"square"` を指定できます。
ボタンの `rotation` は度数文字列で、画像ボタンとCSS描画ボタンの両方に適用されます。
エディタのガイド線は `guides.vertical` と `guides.horizontal` に背景左上基準の座標として保存されます。

## 保存場所

### Webサーバー単体

- 組み込みレイアウト: `public/layout/{name}/layout.json`
- ユーザーレイアウト: `public/user-layouts/{name}/layout.json`
- デフォルト指定: `public/default-layout.json`
- PIDファイル: `server.pid`

### Electron

- 組み込みレイアウト: アプリ同梱の `public/layout/{name}/layout.json`
- ユーザーレイアウト: Electron `userData` 配下 `user-layouts/{name}/layout.json`
- デフォルト指定: Electron `userData` 配下 `default-layout.json`
- PIDファイル: Electron `userData` 配下 `server.pid`

## 入力処理

`GamepadManager` は `gamepadconnected` / `gamepaddisconnected` を監視し、`requestAnimationFrame` ループで状態を取得します。

- 通常ボタン: Gamepad APIの `buttons[index].pressed`
- 軸入力: `1000000` 以上の内部コードで正方向/負方向を表現
- レバー方向: `stickMappings` の4要素を上、下、左、右として扱う
- 表示ボタン: `buttonMappings` の各要素を表示ボタンに対応させる

## 描画

`GamepadView` はレイアウト値から絶対配置で描画します。

- 背景は画像またはCSS背景色
- ボタンは画像またはCSS円形ボタン
- レバーは画像またはCSS描画
- 編集モードではドラッグ移動と割り当てクリックを有効化

## ビルド

サーバーとElectron mainはesbuild、ブラウザ向けのeditorとviewerはViteでバンドルします。

```bash
npm run build:server   # dist/server.js
npm run build:electron # dist/electron.js
npm run build:web      # public/index.html、public/view.html、public/assets/*
```

`npm run build` は上記をまとめて実行します。`npm run typecheck` は `tsc --noEmit` を実行します。

## トラブルシューティング

### ポートが使用中

```bash
lsof -i :33770
```

既存プロセスを終了するか、Electron/Webサーバーを多重起動していないか確認してください。

### ゲームパッドが認識されない

1. ゲームパッドを接続して任意のボタンを押す
2. ブラウザまたはElectronウィンドウを再読み込みする
3. 開発者ツールで `navigator.getGamepads()` を確認する

### OBSに反映されない

1. 編集画面でレイアウトを保存する
2. 「デフォルトに設定」を押す
3. OBSブラウザソースを再読み込みする
