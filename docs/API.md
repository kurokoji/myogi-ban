# API リファレンス

## 概要

FightStick Viewerは、REST APIとWebSocketを提供します。

**ベースURL**: `http://localhost:33770`

## REST API

### レイアウト一覧取得

保存されているレイアウトの一覧を取得します。

**エンドポイント**: `GET /api/layouts`

**レスポンス**:
```json
["default", "hitbox", "mypreset"]
```

**例**:
```bash
curl http://localhost:33770/api/layouts
```

---

### レイアウト取得

指定されたレイアウトを取得します。

**エンドポイント**: `GET /api/layout/:name`

**パラメータ**:
- `name`: レイアウト名（例: `default`, `hitbox`）

**レスポンス**:
```json
{
  "version": "210124",
  "name": "default",
  "totalbuttonshow": 10,
  "showstick": true,
  "stick": {
    "x": "110",
    "y": "125",
    "w": "100",
    "h": "100"
  },
  "defaultbuttons": {
    "x": "",
    "y": "",
    "w": "60",
    "h": "60",
    "img": "button-released.png",
    "xp": "",
    "yp": "",
    "wp": "",
    "hp": "",
    "imgp": "button-pressed.png"
  },
  "buttons": [...],
  "background": {
    "show": true,
    "image": "",
    "scale": "1",
    "w": "",
    "h": ""
  },
  "inputhistorymode": {
    "toggle": false,
    "direction": 0,
    "count": 20,
    "game": "default",
    "btnmapping": ["1", "2", "3", "4", "0", ...]
  },
  "buttonMappings": [1, 2, 3, 6, 0, 4, 5, 7, 8, 9],
  "stickMappings": [12, 13, 14, 15]
}
```

**例**:
```bash
curl http://localhost:33770/api/layout/default
```

---

### レイアウト保存

レイアウトを保存します。

**エンドポイント**: `POST /api/layout/save`

**リクエストボディ**:
```json
{
  "name": "mypreset",
  "data": {
    "version": "210124",
    "name": "mypreset",
    "totalbuttonshow": 10,
    ...
  }
}
```

**レスポンス**:
```json
{
  "ok": true
}
```

**例**:
```bash
curl -X POST http://localhost:33770/api/layout/save \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mypreset",
    "data": {
      "version": "210124",
      "name": "mypreset",
      "totalbuttonshow": 10,
      "showstick": true,
      "stick": {"x": "110", "y": "125", "w": "100", "h": "100"},
      "defaultbuttons": {"w": "60", "h": "60", "img": "button-released.png", "imgp": "button-pressed.png"},
      "buttons": [],
      "background": {"show": true, "image": "", "scale": "1", "w": "", "h": ""},
      "inputhistorymode": {"toggle": false, "direction": 0, "count": 20, "game": "default", "btnmapping": []},
      "buttonMappings": [1, 2, 3, 6, 0, 4, 5, 7, 8, 9],
      "stickMappings": [12, 13, 14, 15]
    }
  }'
```

---

### 画像アップロード

画像をアップロードします。

**エンドポイント**: `POST /api/upload-image`

**リクエストボディ**:
```json
{
  "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "layoutName": "custom",
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

**例**:
```bash
# JavaScript (ブラウザ)
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];
const reader = new FileReader();

reader.onload = async (e) => {
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: e.target.result,
      layoutName: 'custom',
      fileName: file.name
    })
  });
  const result = await response.json();
  console.log(result);
};

reader.readAsDataURL(file);
```

---

### ゲームパッド状態送信

ゲームパッドの状態をサーバーに送信します。

**エンドポイント**: `POST /api/state`

**リクエストボディ**:
```json
{
  "stick": "stick stick-up",
  "buttons": [true, false, false, true, false, false, false, false, false, false],
  "input": [0, 3, 1001],
  "connected": true,
  "layout": {...}
}
```

**レスポンス**:
```json
{
  "ok": true
}
```

---

### 現在の状態取得

現在のゲームパッド状態を取得します。

**エンドポイント**: `GET /api/state`

**レスポンス**:
```json
{
  "stick": "stick stick-up",
  "buttons": [true, false, false, true, false, false, false, false, false, false],
  "input": [0, 3, 1001],
  "connected": true,
  "layout": {...}
}
```

**例**:
```bash
curl http://localhost:33770/api/state
```

---

## WebSocket

### 接続

**エンドポイント**: `ws://localhost:33770`

**例**:
```javascript
const ws = new WebSocket('ws://localhost:33770');

ws.onopen = () => {
  console.log('Connected to server');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

ws.onclose = () => {
  console.log('Disconnected from server');
};
```

---

### メッセージ形式

**サーバー → クライアント**:
```json
{
  "type": "state",
  "data": {
    "stick": "stick stick-up",
    "buttons": [true, false, false, true, false, false, false, false, false, false],
    "input": [0, 3, 1001],
    "connected": true,
    "layout": {...}
  }
}
```

---

## データ型

### Layout

```typescript
interface Layout {
  version: string;              // バージョン（例: "210124"）
  name: string;                 // レイアウト名
  totalbuttonshow: number;      // 表示ボタン数（0-48）
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

### StickLayout

```typescript
interface StickLayout {
  x: string;  // X座標（ピクセル）
  y: string;  // Y座標（ピクセル）
  w: string;  // 幅（パーセント）
  h: string;  // 高さ（パーセント）
}
```

### ButtonLayout

```typescript
interface ButtonLayout {
  x: string;   // X座標（ピクセル）
  y: string;   // Y座標（ピクセル）
  w: string;   // 幅（ピクセル）
  h: string;   // 高さ（ピクセル）
  img: string; // 通常時画像ファイル名
  xp: string;  // 押下時X座標
  yp: string;  // 押下時Y座標
  wp: string;  // 押下時幅
  hp: string;  // 押下時高さ
  imgp: string; // 押下時画像ファイル名
}
```

### BackgroundConfig

```typescript
interface BackgroundConfig {
  show: boolean;  // 表示/非表示
  image: string;  // 画像ファイル名
  scale: string;  // 背景画像の拡大率
  w: string;      // OBS用の計算済み幅（ピクセル）
  h: string;      // OBS用の計算済み高さ（ピクセル）
}
```

### InputHistoryMode

```typescript
interface InputHistoryMode {
  toggle: boolean;       // 有効/無効
  direction: number;     // 0: 垂直, 1: 水平（下）, 2: 水平（上）
  count: number;         // 表示件数（1-50）
  game: string;          // "default" または "combination"
  btnmapping: string[];  // ボタンマッピング（同時押しモード用）
}
```

---

## エラーレスポンス

### 404 Not Found

レイアウトが見つからない場合:
```json
{}
```

### 400 Bad Request

リクエスト形式が不正な場合:
```json
{
  "error": "Invalid request"
}
```

### 500 Internal Server Error

サーバーエラーが発生した場合:
```json
{
  "error": "Internal server error"
}
```

---

## 使用例

### レイアウトを読み込んで表示

```javascript
// レイアウト一覧を取得
const layouts = await fetch('/api/layouts').then(r => r.json());
console.log(layouts); // ["default", "hitbox", "mypreset"]

// デフォルトレイアウトを取得
const layout = await fetch('/api/layout/default').then(r => r.json());
console.log(layout);

// レイアウトを保存
await fetch('/api/layout/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'mypreset',
    data: layout
  })
});
```

### WebSocketでリアルタイム更新

```javascript
const ws = new WebSocket('ws://localhost:33770');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'state') {
    updateDisplay(msg.data);
  }
};

function updateDisplay(state) {
  // スティック更新
  document.getElementById('stick').className = state.stick;
  
  // ボタン更新
  state.buttons.forEach((pressed, i) => {
    const btn = document.getElementById(`button${i}`);
    if (pressed) {
      btn.classList.add('button-pressed');
      btn.classList.remove('button-released');
    } else {
      btn.classList.add('button-released');
      btn.classList.remove('button-pressed');
    }
  });
}
```

---

## 制限事項

- **リクエストサイズ**: 最大100MB（画像アップロード用）
- **同時接続数**: 制限なし
- **WebSocketメッセージ**: JSON形式のみ
