# API リファレンス

## 概要

Myogi Banはローカルサーバー上でREST APIとWebSocketを提供します。

**ベースURL**: `http://localhost:33770`

## REST API

### レイアウト一覧取得

保存済みレイアウトの一覧を取得します。組み込みレイアウトとユーザーレイアウトを区別できます。

**エンドポイント**: `GET /api/layouts`

**レスポンス**:

```json
[
  { "name": "default", "builtin": true },
  { "name": "mypreset", "builtin": false }
]
```

### レイアウト取得

指定したレイアウトを取得します。ユーザーレイアウトが同名で存在する場合はユーザーレイアウトが優先されます。

**エンドポイント**: `GET /api/layouts/:name`

**レスポンス例**:

```json
{
  "version": "v1.0.11",
  "name": "default",
  "totalbuttonshow": 8,
  "showstick": true,
  "stick": {
    "x": "130",
    "y": "105",
    "w": "100",
    "h": "100",
    "useCss": true,
    "cssColor": "#e03131",
    "cssPlateColor": "#868e96",
    "cssTransition": "0.02",
    "cssEasing": "ease"
  },
  "defaultbuttons": {
    "x": "0",
    "y": "0",
    "w": "48",
    "h": "48",
    "img": "",
    "xp": "",
    "yp": "",
    "wp": "",
    "hp": "",
    "imgp": "",
    "useCss": true,
    "cssColor": "#e03131",
    "cssPressedColor": "#c2251c",
    "rotation": "0",
    "cssTransition": "0",
    "cssEasing": "linear",
    "cssShape": "circle"
  },
  "buttons": [],
  "background": {
    "show": true,
    "image": "",
    "scale": "1",
    "w": "500",
    "h": "250",
    "useCss": true,
    "cssColor": "#ffffff",
    "cssBorderRadius": 20
  },
  "guides": {
    "vertical": [],
    "horizontal": []
  },
  "buttonMappings": [1, 2, 3, 6, 0, 4, 5, 7],
  "stickMappings": [12, 13, 14, 15]
}
```

存在しないレイアウト名の場合は `{}` を返します。

### レイアウト保存

ユーザーレイアウトとして保存します。保存時に `data.name` はリクエストの `name` で上書きされます。

**エンドポイント**: `PUT /api/layouts/:name`

**リクエストボディ**:

```json
{
  "data": {
    "version": "v1.0.11",
    "name": "mypreset",
    "totalbuttonshow": 8
  }
}
```

**レスポンス**:

```json
{ "ok": true }
```

### レイアウトパッケージのインポート

`.myogi` のZIPバイナリを検証し、画像とレイアウトを原子的に保存します。同名レイアウトが存在する場合は連番名になります。

**エンドポイント**: `POST /api/layout-imports`

**Content-Type**: `application/octet-stream`

不正なパッケージはHTTP 400となり、`package_too_large`、`too_many_files`、`unsafe_path`、`unexpected_file`、`layout_too_large`、`invalid_layout`、`missing_asset`、`image_too_large`、`invalid_image_content` などのエラーコードを返します。

**レスポンス例**:

```json
{
  "ok": true,
  "data": {
    "name": "mypreset-2",
    "layout": {
      "name": "mypreset-2"
    }
  }
}
```

### 画像アップロード

背景画像またはボタン画像をユーザーレイアウト配下へ保存します。`fileName` はサーバー側でbasename化されます。

**エンドポイント**: `POST /api/layouts/:name/assets`

**リクエストボディ**:

```json
{
  "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "fileName": "background.png"
}
```

**レスポンス**:

```json
{
  "ok": true,
  "fileName": "background.png"
}
```

### ゲームパッド状態送信

編集画面から現在の入力状態を送信します。サーバーは状態を保持し、WebSocket接続中のクライアントへ配信します。

**エンドポイント**: `PUT /api/state`

**リクエストボディ**:

```json
{
  "stick": "stick stick-up",
  "buttons": [true, false, false, true],
  "connected": true,
  "layout": {}
}
```

**レスポンス**:

```json
{ "ok": true }
```

### 現在の状態取得

直近に送信されたゲームパッド状態を取得します。未送信の場合は `{}` を返します。

**エンドポイント**: `GET /api/state`

### デフォルトレイアウト取得

OBSビューアと編集画面の初期読み込みに使うデフォルトレイアウト名を取得します。

**エンドポイント**: `GET /api/default-layout`

**レスポンス**:

```json
{ "name": "default" }
```

### デフォルトレイアウト保存

デフォルトレイアウト名を保存します。

**エンドポイント**: `PUT /api/default-layout`

**リクエストボディ**:

```json
{ "name": "mypreset" }
```

**レスポンス**:

```json
{ "ok": true }
```

## WebSocket

**エンドポイント**: `ws://localhost:33770/ws`

接続時に直近の状態があれば以下の形式で送信されます。以降、`PUT /api/state` のたびに同じ形式で配信されます。

```json
{
  "type": "state",
  "data": {
    "stick": "stick stick-up",
    "buttons": [true, false],
    "connected": true,
    "layout": {}
  }
}
```
