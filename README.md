# Myogi Ban

格闘ゲーム向けコントローラー入力を可視化するOBS用ビューアです。編集画面でレイアウトを作り、OBSのブラウザソースには `/view` を指定して使います。

## 主な機能

- リアルタイムなレバー/ボタン入力表示
- OBSブラウザソース用ビューア
- Electronアプリとしての起動と、Webサーバー単体起動
- React + TypeScriptの編集画面
- 日本語/英語のUI切り替え
- CSS描画または画像による背景・レバー・ボタン表現
- レイアウトの保存、読み込み、デフォルト指定
- レイアウトと参照画像をまとめた `.myogi` ファイルのインポート/エクスポート
- ゲームパッドボタン/軸の割り当て

## インストール

```bash
npm install
```

## 起動

### Electronアプリ

```bash
npm start
```

編集画面をElectronウィンドウで開き、同時にローカルサーバーを起動します。

開発時はVite RendererとElectronを一緒に起動します。

```bash
npm run dev
```

Reactコンポーネントの変更は、ElectronウィンドウへFast Refreshで反映されます。
Electron mainの変更時はElectronプロセスが再起動します。

### Webサーバー単体

```bash
npm run start:web
```

開発中は、React Fast Refreshに対応したVite開発サーバーを利用できます。

```bash
npm run dev:web
```

編集画面は `http://localhost:5173` を開いてください。
開発時のレイアウトはプロジェクト内の `.dev-data` に保存されます。
Reactコンポーネントの変更はブラウザへ即時反映されます。
サーバー側の変更時はExpressプロセスだけが再起動します。

ブラウザで以下にアクセスします。

- 開発用編集画面: http://localhost:5173
- 開発用ビューア: http://localhost:5173/view.html
- OBS用ビューア: http://localhost:33770/view

### 停止

```bash
npm stop
```

`npm stop` はWebサーバー単体起動時に作られる `server.pid` を使って停止します。Electronアプリは通常どおりウィンドウを閉じて終了してください。

## OBS設定

1. OBSで「ブラウザソース」を追加
2. URLに `http://localhost:33770/view` を入力
3. 編集画面の「背景」セクションに表示される幅/高さをOBS側にも設定
4. 必要に応じてカスタムCSSや透過設定を調整

## 使い方

1. ゲームパッドを接続し、任意のボタンを押してブラウザに認識させる
2. 編集画面で背景、レバー、ボタン数、色、サイズ、位置を調整
3. プレビュー上のボタンまたはレバー方向をクリックし、割り当てたいゲームパッドボタンを押すか軸を1秒ホールド
4. レイアウト名を入力して保存
5. 必要に応じて「デフォルトに設定」を押し、OBSビューアで使うレイアウトを指定

## ビルド

```bash
# 全ビルド
npm run build

# 個別ビルド
npm run build:server
npm run build:electron
npm run build:web

# 型チェック
npm run typecheck
```

配布用パッケージは以下で作成します。

```bash
npm run build:dist
```

## データ保存場所

レイアウトJSONの現行形式は `formatVersion: 2` です。旧v1形式も読み込めます。共有時はv2の `layout.json` と参照画像をZIPへ格納した `.myogi` ファイルとしてエクスポートします。従来の `.json` ファイルも引き続きインポートできます。

- 組み込みレイアウト: `public/layout/{name}/layout.json`
- Webサーバー単体のユーザーレイアウト: `public/user-layouts/{name}/layout.json`
- Electronのユーザーレイアウト: Electronの `userData` 配下 `user-layouts/{name}/layout.json`
- Webサーバー単体のデフォルト指定: `public/default-layout.json`
- Electronのデフォルト指定: Electronの `userData` 配下 `default-layout.json`

## 技術スタック

- Node.js / Express / WebSocket
- Electron
- React / TypeScript
- Mantine
- i18next / react-i18next
- esbuild
- Web Gamepad API

## ドキュメント

- [機能一覧](docs/FEATURES.md)
- [APIリファレンス](docs/API.md)
- [アーキテクチャ](docs/ARCHITECTURE.md)
- [変更履歴](docs/CHANGELOG.md)

## ライセンス

MIT
