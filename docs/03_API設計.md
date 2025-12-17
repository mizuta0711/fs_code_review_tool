# API設計

## API一覧

| No | メソッド | エンドポイント | 説明 |
|----|---------|--------------|------|
| A01 | POST | `/api/review` | コードレビュー実行 |
| A02 | GET | `/api/prompts` | プロンプト一覧取得 |
| A03 | POST | `/api/prompts` | プロンプト作成 |
| A04 | GET | `/api/prompts/{id}` | プロンプト詳細取得 |
| A05 | PUT | `/api/prompts/{id}` | プロンプト更新 |
| A06 | DELETE | `/api/prompts/{id}` | プロンプト削除 |
| A07 | PUT | `/api/prompts/{id}/default` | デフォルトプロンプト設定 |
| A08 | GET | `/api/settings` | 設定取得 |
| A09 | PUT | `/api/settings` | 設定更新 |

---

## A01: コードレビュー実行

### POST `/api/review`

AIによるコードレビューを実行する。

#### リクエスト

**Headers**:
```
Content-Type: application/json
```

**Body**:
```typescript
{
  // レビュー対象ファイル（1〜10ファイル）
  files: [
    {
      name: string;        // ファイル名（例: "Sample.java"）
      language: string;    // 言語（例: "java"）
      content: string;     // コード内容
    }
  ];

  // 使用するプロンプトID
  promptId: string;

  // AIプロバイダー（任意、デフォルトは設定値）
  provider?: "gemini" | "azure";
}
```

**例**:
```json
{
  "files": [
    {
      "name": "Sample.java",
      "language": "java",
      "content": "public class Sample {\n    public static void main(String[] args) {\n        System.out.println(\"Hello\");\n    }\n}"
    }
  ],
  "promptId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### レスポンス

**成功時 (200 OK)**:
```typescript
{
  // レビュー済みファイル
  reviewedFiles: [
    {
      name: string;        // ファイル名
      language: string;    // 言語
      content: string;     // レビューコメント追加済みコード
    }
  ];

  // 使用したAIプロバイダー
  provider: string;

  // 処理時間（ミリ秒）
  processingTime: number;
}
```

**例**:
```json
{
  "reviewedFiles": [
    {
      "name": "Sample.java",
      "language": "java",
      "content": "// [参考] Javadocコメントを追加しましょう\npublic class Sample {\n    public static void main(String[] args) {\n        System.out.println(\"Hello\");\n    }\n}"
    }
  ],
  "provider": "Google AI (Gemini)",
  "processingTime": 3500
}
```

**エラー時 (400 Bad Request)**:
```json
{
  "error": "validation_error",
  "message": "コードが入力されていません",
  "details": {
    "field": "files",
    "issue": "empty"
  }
}
```

**エラー時 (500 Internal Server Error)**:
```json
{
  "error": "ai_error",
  "message": "AIサービスでエラーが発生しました",
  "details": {
    "provider": "Google AI (Gemini)",
    "originalError": "API quota exceeded"
  }
}
```

---

## A02: プロンプト一覧取得

### GET `/api/prompts`

登録されているプロンプト一覧を取得する。

#### リクエスト

**Query Parameters**:
| パラメータ | 型 | 必須 | 説明 |
|----------|-----|------|------|
| - | - | - | なし |

#### レスポンス

**成功時 (200 OK)**:
```typescript
{
  prompts: [
    {
      id: string;
      name: string;
      description: string | null;
      isDefault: boolean;
      createdAt: string;  // ISO 8601
      updatedAt: string;  // ISO 8601
    }
  ];
}
```

**例**:
```json
{
  "prompts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "中級編AIコードレビュープロンプト",
      "description": "Java初級者向けの詳細なレビュー観点を含むプロンプト",
      "isDefault": true,
      "createdAt": "2024-12-17T10:00:00.000Z",
      "updatedAt": "2024-12-17T10:00:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "簡易レビュープロンプト",
      "description": "シンプルなコードレビュー用",
      "isDefault": false,
      "createdAt": "2024-12-17T11:00:00.000Z",
      "updatedAt": "2024-12-17T11:00:00.000Z"
    }
  ]
}
```

---

## A03: プロンプト作成

### POST `/api/prompts`

新規プロンプトを作成する。

#### リクエスト

**Body**:
```typescript
{
  name: string;           // プロンプト名（1〜100文字）
  description?: string;   // 説明（最大500文字）
  content: string;        // プロンプト内容（1〜50000文字）
}
```

**例**:
```json
{
  "name": "セキュリティ重視プロンプト",
  "description": "セキュリティ観点に特化したレビュー",
  "content": "【あなたへの指示】\nセキュリティの観点からコードレビューを行ってください。\n..."
}
```

#### レスポンス

**成功時 (201 Created)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "セキュリティ重視プロンプト",
  "description": "セキュリティ観点に特化したレビュー",
  "content": "【あなたへの指示】\nセキュリティの観点からコードレビューを行ってください。\n...",
  "isDefault": false,
  "createdAt": "2024-12-17T12:00:00.000Z",
  "updatedAt": "2024-12-17T12:00:00.000Z"
}
```

---

## A04: プロンプト詳細取得

### GET `/api/prompts/{id}`

指定IDのプロンプト詳細を取得する。

#### リクエスト

**Path Parameters**:
| パラメータ | 型 | 説明 |
|----------|-----|------|
| id | string | プロンプトID（UUID） |

#### レスポンス

**成功時 (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "中級編AIコードレビュープロンプト",
  "description": "Java初級者向けの詳細なレビュー観点を含むプロンプト",
  "content": "【あなたへの指示】\nあなたは日本のIT企業に勤める教育担当エンジニアです。\n...",
  "isDefault": true,
  "createdAt": "2024-12-17T10:00:00.000Z",
  "updatedAt": "2024-12-17T10:00:00.000Z"
}
```

**エラー時 (404 Not Found)**:
```json
{
  "error": "not_found",
  "message": "指定されたプロンプトが見つかりません"
}
```

---

## A05: プロンプト更新

### PUT `/api/prompts/{id}`

指定IDのプロンプトを更新する。

#### リクエスト

**Path Parameters**:
| パラメータ | 型 | 説明 |
|----------|-----|------|
| id | string | プロンプトID（UUID） |

**Body**:
```typescript
{
  name?: string;          // プロンプト名
  description?: string;   // 説明
  content?: string;       // プロンプト内容
}
```

#### レスポンス

**成功時 (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "中級編AIコードレビュープロンプト（更新）",
  "description": "更新された説明",
  "content": "更新されたプロンプト内容...",
  "isDefault": true,
  "createdAt": "2024-12-17T10:00:00.000Z",
  "updatedAt": "2024-12-17T14:00:00.000Z"
}
```

---

## A06: プロンプト削除

### DELETE `/api/prompts/{id}`

指定IDのプロンプトを削除する。

#### リクエスト

**Path Parameters**:
| パラメータ | 型 | 説明 |
|----------|-----|------|
| id | string | プロンプトID（UUID） |

#### レスポンス

**成功時 (200 OK)**:
```json
{
  "message": "プロンプトを削除しました"
}
```

**エラー時 (400 Bad Request)**:
```json
{
  "error": "cannot_delete_default",
  "message": "デフォルトプロンプトは削除できません"
}
```

---

## A07: デフォルトプロンプト設定

### PUT `/api/prompts/{id}/default`

指定IDのプロンプトをデフォルトに設定する。

#### リクエスト

**Path Parameters**:
| パラメータ | 型 | 説明 |
|----------|-----|------|
| id | string | プロンプトID（UUID） |

#### レスポンス

**成功時 (200 OK)**:
```json
{
  "message": "デフォルトプロンプトを設定しました",
  "prompt": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "簡易レビュープロンプト",
    "isDefault": true
  }
}
```

---

## A08: 設定取得

### GET `/api/settings`

アプリケーション設定を取得する。

#### レスポンス

**成功時 (200 OK)**:
```typescript
{
  // 現在のAIプロバイダー
  aiProvider: "gemini" | "azure";

  // 各プロバイダーの設定状況
  providers: {
    gemini: {
      configured: boolean;  // API Key設定済みか
    };
    azure: {
      configured: boolean;  // 必要な設定が揃っているか
    };
  };
}
```

**例**:
```json
{
  "aiProvider": "gemini",
  "providers": {
    "gemini": {
      "configured": true
    },
    "azure": {
      "configured": false
    }
  }
}
```

---

## A09: 設定更新

### PUT `/api/settings`

アプリケーション設定を更新する。

#### リクエスト

**Body**:
```typescript
{
  aiProvider?: "gemini" | "azure";
}
```

#### レスポンス

**成功時 (200 OK)**:
```json
{
  "message": "設定を更新しました",
  "settings": {
    "aiProvider": "azure"
  }
}
```

---

## 共通エラーレスポンス

### エラー形式

```typescript
{
  error: string;       // エラーコード
  message: string;     // エラーメッセージ（日本語）
  details?: object;    // 詳細情報（任意）
}
```

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|-------|--------------|------|
| `validation_error` | 400 | バリデーションエラー |
| `not_found` | 404 | リソースが見つからない |
| `cannot_delete_default` | 400 | デフォルト削除不可 |
| `ai_error` | 500 | AIサービスエラー |
| `internal_error` | 500 | 内部エラー |

---

## 認証について

**本アプリはログイン不要のため、認証は実装しません。**

将来的に認証機能を追加する場合は、以下を検討：
- API キーによる簡易認証
- NextAuth.js による OAuth 認証

---

## レート制限

### 制限値

| エンドポイント | 制限 |
|--------------|------|
| POST `/api/review` | 10リクエスト/分 |
| その他 | 60リクエスト/分 |

### レスポンス（制限超過時）

**429 Too Many Requests**:
```json
{
  "error": "rate_limit_exceeded",
  "message": "リクエスト数が上限に達しました。しばらく待ってから再試行してください。",
  "retryAfter": 60
}
```

---

## 次のステップ

1. [04_データベース設計.md](./04_データベース設計.md) - データベーススキーマ
