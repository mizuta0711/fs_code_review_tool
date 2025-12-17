# FSCodeReviewTool リファクタリング計画

## 1. 概要

本ドキュメントは、FSCodeReviewToolのコードベースをより保守性・拡張性の高い設計にリファクタリングするための計画をまとめたものです。

### 1.1 参考プロジェクト
- **EngineerPotal/engineer-potal**: Service-Repositoryパターンを採用した良い設計例

### 1.2 リファクタリングの目標
1. Service-Repositoryパターンの導入
2. 定数の一元管理
3. ビジネスロジックとコントローラーの分離
4. 重複コードの排除
5. Zodによるバリデーションの統一
6. エラーハンドリングの統一

---

## 2. 現状分析

### 2.1 現在のディレクトリ構造

```
src/
├── app/
│   ├── api/
│   │   ├── prompts/
│   │   │   ├── route.ts          # 直接Prisma呼び出し
│   │   │   └── [id]/
│   │   │       ├── route.ts      # 直接Prisma呼び出し
│   │   │       └── default/
│   │   │           └── route.ts  # 直接Prisma呼び出し
│   │   ├── review/
│   │   │   └── route.ts          # 直接Prisma呼び出し + AIクライアント
│   │   └── settings/
│   │       └── route.ts          # 直接Prisma呼び出し
│   ├── prompts/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── components/
│   ├── ui/                       # shadcn/ui コンポーネント
│   └── layout/
├── lib/
│   ├── ai/                       # AIクライアント実装
│   ├── api-client.ts             # フロントエンド用APIクライアント
│   ├── prisma.ts
│   └── utils.ts
└── stores/                       # Zustandストア
```

### 2.2 問題点の詳細

#### 問題1: Service-Repositoryパターンが未実装
- **現状**: APIルート（route.ts）から直接Prismaを呼び出している
- **影響**: テスタビリティが低く、ビジネスロジックの再利用が困難

```typescript
// 現状: route.ts内で直接DB操作
const prompts = await prisma.prompt.findMany({...});
```

#### 問題2: 定数が散在している
- **現状**: 各ファイル内でハードコードされた値が存在
- **例**:
  - `settings/route.ts`: `VALID_PROVIDERS = ["gemini", "azure-openai"]`
  - エラーメッセージが各所で直接記述

#### 問題3: ビジネスロジックがコントローラーに混在
- **現状**: バリデーション、DB操作、ビジネスルールがすべてroute.ts内に存在
- **例**: `review/route.ts`でプロンプト取得、設定取得、AIクライアント初期化、レビュー実行が一箇所に

#### 問題4: 重複コード
1. **存在確認パターン**:
```typescript
// [id]/route.ts GET, PUT, DELETE すべてで重複
const existingPrompt = await prisma.prompt.findUnique({ where: { id } });
if (!existingPrompt) {
  return NextResponse.json({ error: "プロンプトが見つかりません" }, { status: 404 });
}
```

2. **エラーレスポンス生成**:
```typescript
// 同じパターンが多数存在
return NextResponse.json({ error: "〇〇に失敗しました" }, { status: 500 });
```

3. **バリデーションコード**:
```typescript
// name, contentのバリデーションが POST, PUT で重複
if (!name || typeof name !== "string" || name.trim().length === 0) {...}
```

#### 問題5: 手動バリデーション
- **現状**: Zodを使用せず、各APIルートで手動バリデーション
- **影響**: 型安全性が低く、バリデーションルールの一貫性がない

#### 問題6: その他の問題
- 型定義がファイル内に散在（`RouteParams`など）
- api-helpersが存在しない
- エラーハンドリングが統一されていない
- ロギングが不十分

---

## 3. リファクタリング後の目標構造

```
src/
├── app/
│   ├── api/
│   │   ├── prompts/
│   │   │   ├── route.ts          # シンプルなコントローラー
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── default/
│   │   │           └── route.ts
│   │   ├── review/
│   │   │   └── route.ts
│   │   └── settings/
│   │       └── route.ts
│   ├── prompts/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── components/
│   ├── ui/
│   └── layout/
├── features/                     # 【新規】Feature-based Architecture
│   ├── prompt/
│   │   ├── repositories/
│   │   │   └── promptRepository.server.ts
│   │   └── services/
│   │       └── promptService.server.ts
│   ├── review/
│   │   └── services/
│   │       └── reviewService.server.ts
│   └── settings/
│       ├── repositories/
│       │   └── settingsRepository.server.ts
│       └── services/
│           └── settingsService.server.ts
├── lib/
│   ├── ai/
│   ├── api-client.ts
│   ├── api-helpers.ts            # 【新規】API共通ヘルパー
│   ├── constants.ts              # 【新規】定数一元管理
│   ├── prisma.ts
│   ├── utils.ts
│   └── validation/               # 【新規】Zodスキーマ
│       ├── index.ts
│       ├── common.ts
│       ├── prompt.ts
│       ├── review.ts
│       └── settings.ts
├── stores/
└── types/                        # 【新規】型定義一元管理
    ├── index.ts
    ├── api.ts
    ├── prompt.ts
    └── review.ts
```

---

## 4. 実装計画

### Phase 1: 基盤整備

#### 1.1 定数ファイルの作成
**ファイル**: `src/lib/constants.ts`

```typescript
// AIプロバイダー
export const AI_PROVIDERS = {
  GEMINI: "gemini",
  AZURE_OPENAI: "azure-openai",
} as const;

export const VALID_AI_PROVIDERS = Object.values(AI_PROVIDERS);

// バリデーション
export const VALIDATION = {
  PROMPT_NAME_MAX_LENGTH: 100,
  PROMPT_CONTENT_MAX_LENGTH: 50000,
  PROMPT_DESCRIPTION_MAX_LENGTH: 500,
} as const;

// HTTPステータス
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  GATEWAY_TIMEOUT: 504,
  TOO_MANY_REQUESTS: 429,
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  PROMPT: {
    NOT_FOUND: "プロンプトが見つかりません",
    NAME_REQUIRED: "プロンプト名は必須です",
    CONTENT_REQUIRED: "プロンプト内容は必須です",
    CANNOT_DELETE_DEFAULT: "デフォルトプロンプトは削除できません",
    CREATE_FAILED: "プロンプトの作成に失敗しました",
    UPDATE_FAILED: "プロンプトの更新に失敗しました",
    DELETE_FAILED: "プロンプトの削除に失敗しました",
    FETCH_FAILED: "プロンプトの取得に失敗しました",
  },
  SETTINGS: {
    FETCH_FAILED: "設定の取得に失敗しました",
    UPDATE_FAILED: "設定の更新に失敗しました",
    INVALID_PROVIDER: "無効なAIプロバイダーです",
  },
  REVIEW: {
    FILES_REQUIRED: "レビュー対象のファイルが必要です",
    FILE_INVALID: "ファイル名とコンテンツは必須です",
    DEFAULT_PROMPT_NOT_SET: "デフォルトプロンプトが設定されていません",
    AI_CLIENT_INIT_FAILED: "AIクライアントの初期化に失敗しました",
    TIMEOUT: "レビューがタイムアウトしました",
    RATE_LIMITED: "API利用制限に達しました",
    FAILED: "レビューの実行に失敗しました",
  },
} as const;
```

#### 1.2 型定義ファイルの作成
**ファイル**: `src/types/index.ts`

```typescript
// API共通型
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

// ルートパラメータ型
export interface RouteParams<T = { id: string }> {
  params: Promise<T>;
}
```

**ファイル**: `src/types/prompt.ts`
**ファイル**: `src/types/review.ts`

#### 1.3 Zodスキーマの作成
**ファイル**: `src/lib/validation/common.ts`

```typescript
import { z } from "zod";

export const commonSchemas = {
  uuid: z.string().uuid("無効なIDです"),
  nonEmptyString: (fieldName: string) =>
    z.string().min(1, `${fieldName}は必須です`).transform((s) => s.trim()),
};
```

**ファイル**: `src/lib/validation/prompt.ts`

```typescript
import { z } from "zod";
import { VALIDATION } from "@/lib/constants";

export const createPromptSchema = z.object({
  name: z.string()
    .min(1, "プロンプト名は必須です")
    .max(VALIDATION.PROMPT_NAME_MAX_LENGTH, `プロンプト名は${VALIDATION.PROMPT_NAME_MAX_LENGTH}文字以内で入力してください`)
    .transform((s) => s.trim()),
  description: z.string()
    .max(VALIDATION.PROMPT_DESCRIPTION_MAX_LENGTH)
    .optional()
    .transform((s) => s?.trim() || null),
  content: z.string()
    .min(1, "プロンプト内容は必須です")
    .max(VALIDATION.PROMPT_CONTENT_MAX_LENGTH)
    .transform((s) => s.trim()),
});

export const updatePromptSchema = z.object({
  name: z.string()
    .min(1, "プロンプト名は空にできません")
    .max(VALIDATION.PROMPT_NAME_MAX_LENGTH)
    .transform((s) => s.trim())
    .optional(),
  description: z.string()
    .max(VALIDATION.PROMPT_DESCRIPTION_MAX_LENGTH)
    .transform((s) => s?.trim() || null)
    .optional(),
  content: z.string()
    .min(1, "プロンプト内容は空にできません")
    .max(VALIDATION.PROMPT_CONTENT_MAX_LENGTH)
    .transform((s) => s.trim())
    .optional(),
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
```

#### 1.4 API共通ヘルパーの作成
**ファイル**: `src/lib/api-helpers.ts`

```typescript
import { NextResponse } from "next/server";
import { z } from "zod";
import { HTTP_STATUS } from "./constants";

// エラーレスポンス生成
export function createErrorResponse(
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// 成功レスポンス生成
export function createSuccessResponse<T>(
  data: T,
  status: number = HTTP_STATUS.OK
): NextResponse {
  return NextResponse.json(data, { status });
}

// Zodバリデーション実行
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.errors[0]?.message || "バリデーションエラー";
    return {
      success: false,
      error: createErrorResponse(errorMessage, HTTP_STATUS.BAD_REQUEST),
    };
  }
  return { success: true, data: result.data };
}
```

---

### Phase 2: Repository層の実装

#### 2.1 プロンプトRepository
**ファイル**: `src/features/prompt/repositories/promptRepository.server.ts`

```typescript
import { prisma } from "@/lib/prisma";
import type { Prompt } from "@prisma/client";
import type { CreatePromptInput, UpdatePromptInput } from "@/lib/validation/prompt";

export const promptRepository = {
  // 一覧取得
  findAll: async (): Promise<Prompt[]> => {
    return prisma.prompt.findMany({
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
  },

  // ID検索
  findById: async (id: string): Promise<Prompt | null> => {
    return prisma.prompt.findUnique({ where: { id } });
  },

  // デフォルト取得
  findDefault: async (): Promise<Prompt | null> => {
    return prisma.prompt.findFirst({ where: { isDefault: true } });
  },

  // 作成
  create: async (data: CreatePromptInput): Promise<Prompt> => {
    return prisma.prompt.create({
      data: {
        ...data,
        isDefault: false,
      },
    });
  },

  // 更新
  update: async (id: string, data: UpdatePromptInput): Promise<Prompt> => {
    return prisma.prompt.update({
      where: { id },
      data,
    });
  },

  // 削除
  delete: async (id: string): Promise<void> => {
    await prisma.prompt.delete({ where: { id } });
  },

  // デフォルト設定（トランザクション）
  setDefault: async (id: string): Promise<Prompt> => {
    return prisma.$transaction(async (tx) => {
      await tx.prompt.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
      return tx.prompt.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  },
};
```

#### 2.2 設定Repository
**ファイル**: `src/features/settings/repositories/settingsRepository.server.ts`

---

### Phase 3: Service層の実装

#### 3.1 プロンプトService
**ファイル**: `src/features/prompt/services/promptService.server.ts`

```typescript
import { promptRepository } from "../repositories/promptRepository.server";
import { ERROR_MESSAGES } from "@/lib/constants";
import type { CreatePromptInput, UpdatePromptInput } from "@/lib/validation/prompt";

export class PromptNotFoundError extends Error {
  constructor() {
    super(ERROR_MESSAGES.PROMPT.NOT_FOUND);
    this.name = "PromptNotFoundError";
  }
}

export class CannotDeleteDefaultPromptError extends Error {
  constructor() {
    super(ERROR_MESSAGES.PROMPT.CANNOT_DELETE_DEFAULT);
    this.name = "CannotDeleteDefaultPromptError";
  }
}

export const promptService = {
  // 一覧取得
  getAll: async () => {
    return promptRepository.findAll();
  },

  // 詳細取得
  getById: async (id: string) => {
    const prompt = await promptRepository.findById(id);
    if (!prompt) {
      throw new PromptNotFoundError();
    }
    return prompt;
  },

  // 作成
  create: async (input: CreatePromptInput) => {
    return promptRepository.create(input);
  },

  // 更新
  update: async (id: string, input: UpdatePromptInput) => {
    // 存在確認
    const existing = await promptRepository.findById(id);
    if (!existing) {
      throw new PromptNotFoundError();
    }
    return promptRepository.update(id, input);
  },

  // 削除
  delete: async (id: string) => {
    const existing = await promptRepository.findById(id);
    if (!existing) {
      throw new PromptNotFoundError();
    }
    if (existing.isDefault) {
      throw new CannotDeleteDefaultPromptError();
    }
    await promptRepository.delete(id);
  },

  // デフォルト設定
  setDefault: async (id: string) => {
    const existing = await promptRepository.findById(id);
    if (!existing) {
      throw new PromptNotFoundError();
    }
    return promptRepository.setDefault(id);
  },
};
```

#### 3.2 レビューService
**ファイル**: `src/features/review/services/reviewService.server.ts`

---

### Phase 4: APIルートのリファクタリング

#### 4.1 リファクタリング後のAPIルート例
**ファイル**: `src/app/api/prompts/route.ts`

```typescript
import { NextRequest } from "next/server";
import { promptService } from "@/features/prompt/services/promptService.server";
import { createPromptSchema } from "@/lib/validation/prompt";
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequestBody,
} from "@/lib/api-helpers";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

// GET /api/prompts - プロンプト一覧取得
export async function GET() {
  try {
    const prompts = await promptService.getAll();
    return createSuccessResponse(prompts);
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
    return createErrorResponse(ERROR_MESSAGES.PROMPT.FETCH_FAILED);
  }
}

// POST /api/prompts - プロンプト作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = validateRequestBody(createPromptSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const prompt = await promptService.create(validation.data);
    return createSuccessResponse(prompt, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error("Failed to create prompt:", error);
    return createErrorResponse(ERROR_MESSAGES.PROMPT.CREATE_FAILED);
  }
}
```

---

## 5. 実装優先順位

| 優先度 | Phase | 内容 | 影響範囲 |
|--------|-------|------|----------|
| 高 | Phase 1.1 | 定数ファイル作成 | 全API |
| 高 | Phase 1.2 | 型定義ファイル作成 | 全API |
| 高 | Phase 1.3 | Zodスキーマ作成 | 全API |
| 高 | Phase 1.4 | API共通ヘルパー作成 | 全API |
| 中 | Phase 2.1 | プロンプトRepository | prompts API |
| 中 | Phase 2.2 | 設定Repository | settings API |
| 中 | Phase 3.1 | プロンプトService | prompts API |
| 中 | Phase 3.2 | レビューService | review API |
| 低 | Phase 4 | APIルートリファクタリング | 全API |

---

## 6. 追加の改善提案

### 6.1 エラーハンドリングの統一
カスタムエラークラスを作成し、APIルートで統一的にハンドリング

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}が見つかりません`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}
```

### 6.2 ロギングの追加
- 構造化ログの導入
- リクエスト/レスポンスのログ記録
- エラーログの詳細化

### 6.3 テストの追加
- Repository層のユニットテスト
- Service層のユニットテスト
- APIルートの統合テスト

### 6.4 トランザクション処理の改善
- 複数テーブルを操作する処理でのトランザクション活用

---

## 7. リファクタリング実施時の注意点

1. **段階的実施**: 一度にすべてを変更せず、Phase毎に実施・動作確認
2. **テスト実行**: 各Phase完了後に`npm run build`と動作確認
3. **既存機能の維持**: リファクタリング中も既存APIの動作を維持
4. **コミット粒度**: 各Phaseまたはサブタスク毎にコミット
5. **ドキュメント同期**: CLAUDE.mdの更新

---

## 8. 参考資料

- 参考プロジェクト: `D:\Develop\Web\EngineerPotal\engineer-potal`
- Feature構造例: `src/features/article/`
- Repository例: `articleRepository.server.ts`
- Service例: `articleService.server.ts`
- Validation例: `src/lib/validation/`
- API Helpers例: `src/lib/api-helpers.ts`
