# MVP実装計画

## 概要

本ドキュメントは、FSCodeReviewToolのMVP（Minimum Viable Product）実装計画を定義する。
モックで検証済みの機能をベースに、実際に動作するアプリケーションを構築する。

### MVP目標
- モックの全機能を実際に動作させる
- Gemini / Azure OpenAI によるコードレビュー実行
- プロンプト管理機能
- 設定管理機能

### 技術スタック
| 項目 | 技術 |
|-----|------|
| フレームワーク | Next.js 15 (App Router) |
| 言語 | TypeScript |
| UI | shadcn/ui, Tailwind CSS |
| エディタ | Monaco Editor |
| データベース | PostgreSQL (Neon) |
| ORM | Prisma |
| 状態管理 | Zustand |
| AI | Google Gemini API, Azure OpenAI |

---

## 実装フェーズ

### Phase 1: 基盤構築（1日目）

#### 1.1 Prisma セットアップ
- [ ] Prisma インストール
- [ ] スキーマ定義（Prompt, Setting）
- [ ] Neon データベース接続設定
- [ ] 初回マイグレーション実行

```bash
npm install prisma @prisma/client
npx prisma init
```

**成果物:**
- `prisma/schema.prisma`
- `.env.local`（DATABASE_URL設定）

#### 1.2 シードデータ作成
- [ ] シードスクリプト作成
- [ ] 中級編AIコードレビュープロンプトを初期データとして登録
- [ ] デフォルト設定の初期化

**成果物:**
- `prisma/seed.ts`

#### 1.3 Prisma クライアント設定
- [ ] Prisma クライアントのシングルトン設定
- [ ] 開発/本番環境の切り替え対応

**成果物:**
- `src/lib/prisma.ts`

---

### Phase 2: API実装 - プロンプト管理（2日目）

#### 2.1 プロンプト一覧取得 API
- [ ] `GET /api/prompts` 実装
- [ ] レスポンス形式の定義

**成果物:**
- `src/app/api/prompts/route.ts`

#### 2.2 プロンプト作成 API
- [ ] `POST /api/prompts` 実装
- [ ] バリデーション（名前、内容の必須チェック）

#### 2.3 プロンプト詳細・更新・削除 API
- [ ] `GET /api/prompts/[id]/route.ts`
- [ ] `PUT /api/prompts/[id]/route.ts`
- [ ] `DELETE /api/prompts/[id]/route.ts`
- [ ] デフォルトプロンプト削除不可の制御

**成果物:**
- `src/app/api/prompts/[id]/route.ts`

#### 2.4 デフォルトプロンプト設定 API
- [ ] `PUT /api/prompts/[id]/default` 実装
- [ ] トランザクションによる整合性確保

**成果物:**
- `src/app/api/prompts/[id]/default/route.ts`

---

### Phase 3: API実装 - 設定管理（2日目）

#### 3.1 設定取得 API
- [ ] `GET /api/settings` 実装
- [ ] 各プロバイダーの設定状況チェック

**成果物:**
- `src/app/api/settings/route.ts`

#### 3.2 設定更新 API
- [ ] `PUT /api/settings` 実装
- [ ] AIプロバイダー切り替え

---

### Phase 4: AIクライアント実装（3日目）

#### 4.1 AIクライアントインターフェース
- [ ] `LanguageModelClient` インターフェース定義
- [ ] リクエスト/レスポンス型定義

**成果物:**
- `src/lib/ai/types.ts`
- `src/lib/ai/client.ts`

```typescript
// src/lib/ai/types.ts
export interface ReviewRequest {
  files: {
    name: string;
    language: string;
    content: string;
  }[];
  prompt: string;
}

export interface ReviewResponse {
  reviewedFiles: {
    name: string;
    language: string;
    content: string;
  }[];
}

export interface LanguageModelClient {
  review(request: ReviewRequest): Promise<ReviewResponse>;
}
```

#### 4.2 Gemini クライアント実装
- [ ] Google AI SDK インストール
- [ ] `GeminiClient` クラス実装
- [ ] プロンプト構築ロジック

```bash
npm install @google/generative-ai
```

**成果物:**
- `src/lib/ai/gemini.ts`

#### 4.3 Azure OpenAI クライアント実装
- [ ] Azure OpenAI SDK インストール
- [ ] `AzureOpenAIClient` クラス実装

```bash
npm install @azure/openai
```

**成果物:**
- `src/lib/ai/azure-openai.ts`

#### 4.4 AIクライアントファクトリ
- [ ] 設定に基づいてクライアントを生成
- [ ] 環境変数 / ローカルストレージ設定の優先順位制御

**成果物:**
- `src/lib/ai/factory.ts`

---

### Phase 5: レビュー実行 API（3日目）

#### 5.1 レビュー実行 API
- [ ] `POST /api/review` 実装
- [ ] 入力バリデーション
- [ ] プロンプト取得
- [ ] AIクライアント呼び出し
- [ ] レスポンス整形

**成果物:**
- `src/app/api/review/route.ts`

#### 5.2 エラーハンドリング
- [ ] AI APIエラーの適切な処理
- [ ] タイムアウト処理
- [ ] レート制限対応

---

### Phase 6: フロントエンド実装 - 状態管理（4日目）

#### 6.1 Zustand ストア設計
- [ ] ファイル管理ストア
- [ ] レビュー状態ストア
- [ ] 設定ストア

**成果物:**
- `src/stores/file-store.ts`
- `src/stores/review-store.ts`
- `src/stores/settings-store.ts`

```typescript
// src/stores/file-store.ts
interface FileStore {
  files: CodeFile[];
  activeFileId: string;
  addFile: () => void;
  removeFile: (id: string) => void;
  updateFile: (id: string, updates: Partial<CodeFile>) => void;
  setActiveFile: (id: string) => void;
}
```

---

### Phase 7: フロントエンド実装 - API連携（4-5日目）

#### 7.1 APIクライアント作成
- [ ] fetch ラッパー作成
- [ ] エラーハンドリング共通化

**成果物:**
- `src/lib/api-client.ts`

#### 7.2 メイン画面のAPI連携
- [ ] プロンプト一覧取得
- [ ] レビュー実行API呼び出し
- [ ] モックデータの削除

**更新対象:**
- `src/app/page.tsx`

#### 7.3 プロンプト管理画面のAPI連携
- [ ] プロンプト一覧取得
- [ ] CRUD操作のAPI連携
- [ ] モックデータの削除

**更新対象:**
- `src/app/prompts/page.tsx`

#### 7.4 設定画面のAPI連携
- [ ] 設定取得/更新API連携
- [ ] 接続テスト実装
- [ ] モックデータの削除

**更新対象:**
- `src/app/settings/page.tsx`

---

### Phase 8: 統合テスト・仕上げ（5日目）

#### 8.1 E2Eテスト
- [ ] メイン画面のレビューフロー
- [ ] プロンプト管理のCRUD
- [ ] 設定変更

#### 8.2 エラー処理の確認
- [ ] API未設定時のエラー表示
- [ ] ネットワークエラー時の表示
- [ ] AI APIエラー時の表示

#### 8.3 最終調整
- [ ] ローディング状態の確認
- [ ] トースト通知の確認
- [ ] レスポンシブ対応確認

---

## ディレクトリ構成（実装後）

```
src/
├── app/
│   ├── api/
│   │   ├── prompts/
│   │   │   ├── route.ts              # GET, POST
│   │   │   └── [id]/
│   │   │       ├── route.ts          # GET, PUT, DELETE
│   │   │       └── default/
│   │   │           └── route.ts      # PUT
│   │   ├── review/
│   │   │   └── route.ts              # POST
│   │   └── settings/
│   │       └── route.ts              # GET, PUT
│   ├── prompts/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   │   └── Header.tsx
│   └── ui/                           # shadcn/ui components
├── lib/
│   ├── ai/
│   │   ├── types.ts                  # 型定義
│   │   ├── client.ts                 # インターフェース
│   │   ├── gemini.ts                 # Geminiクライアント
│   │   ├── azure-openai.ts           # Azure OpenAIクライアント
│   │   └── factory.ts                # ファクトリ
│   ├── api-client.ts                 # フロントエンド用APIクライアント
│   ├── prisma.ts                     # Prismaクライアント
│   └── utils.ts
├── stores/
│   ├── file-store.ts
│   ├── review-store.ts
│   └── settings-store.ts
└── types/
    └── index.ts                      # 共通型定義

prisma/
├── schema.prisma
└── seed.ts
```

---

## 環境変数

```env
# .env.local

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# Google AI (Gemini)
GEMINI_API_KEY="your-gemini-api-key"

# Azure OpenAI
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_KEY="your-azure-api-key"
AZURE_OPENAI_DEPLOYMENT="gpt-4o"
AZURE_OPENAI_API_VERSION="2024-10-21"
```

---

## 実装順序チェックリスト

### Day 1: 基盤構築
- [ ] Prisma セットアップ
- [ ] データベース接続確認
- [ ] シードデータ投入

### Day 2: プロンプト・設定API
- [ ] プロンプトCRUD API
- [ ] 設定API
- [ ] APIテスト（curl等で確認）

### Day 3: AI連携
- [ ] AIクライアント実装
- [ ] レビューAPI実装
- [ ] AI APIテスト

### Day 4: フロントエンド連携
- [ ] Zustandストア実装
- [ ] APIクライアント実装
- [ ] メイン画面のAPI連携

### Day 5: 仕上げ
- [ ] プロンプト管理画面のAPI連携
- [ ] 設定画面のAPI連携
- [ ] 統合テスト・バグ修正

---

## リスクと対策

| リスク | 対策 |
|-------|------|
| AI API の応答が遅い | タイムアウト設定（60秒）、ローディング表示 |
| AI API のレート制限 | リクエスト間隔制御、エラー時のリトライ |
| 大きなコードの処理 | 文字数制限（100,000文字）、警告表示 |
| API キー漏洩 | 環境変数使用、クライアントサイドでの非表示 |

---

## 成功基準

MVP完了時に以下が動作すること：

1. **レビュー機能**
   - コードを入力してレビュー実行できる
   - 複数ファイルを一括レビューできる
   - レビュー結果をコピー/ダウンロードできる

2. **プロンプト管理**
   - プロンプトの追加・編集・削除ができる
   - デフォルトプロンプトを設定できる

3. **設定管理**
   - AIプロバイダーを切り替えられる
   - 接続テストが実行できる

4. **AI連携**
   - Gemini でレビューが実行できる
   - Azure OpenAI でレビューが実行できる
