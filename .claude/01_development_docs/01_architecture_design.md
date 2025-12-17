# アーキテクチャ設計

## システム全体アーキテクチャ

### 設計思想
FSCodeReviewToolは以下のアーキテクチャ原則に基づいて設計されています：

- **Feature-based Architecture**: 機能ごとのディレクトリ分割による高凝集・低結合
- **Repository Pattern**: データアクセス層の抽象化
- **Service Layer**: ビジネスロジックの集約
- **Custom Hooks**: UI とロジックの分離
- **API Helper Functions**: 統一されたAPI実装パターン
- **データアクセス層の分離**: APIルートからの直接DB操作は厳格に禁止

### アーキテクチャ図
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │   Application   │    │  Infrastructure │
│     Layer       │◄──►│     Layer       │◄──►│     Layer       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  UI Components  │    │   Services      │    │   Database      │
│  Custom Hooks   │    │   Repositories  │    │   External APIs │
│  Pages/Layouts  │    │   API Helpers   │    │   File Storage  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ディレクトリ構造

### 推奨ディレクトリ構造
```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API Routes（route.ts パターン）
│   │   ├── reviews/       # レビュー関連API
│   │   ├── projects/      # プロジェクト関連API
│   │   ├── users/         # ユーザー関連API
│   │   └── auth/          # 認証関連API
│   ├── reviews/           # レビュー機能ページ
│   ├── projects/          # プロジェクト機能ページ
│   ├── profile/           # プロフィール機能ページ
│   ├── layout.tsx         # Root Layout（プロバイダー設定）
│   └── page.tsx           # トップページ
├── components/            # 共通コンポーネント
│   ├── ui/               # shadcn/ui コンポーネント
│   ├── common/           # 汎用コンポーネント
│   └── layout/           # レイアウトコンポーネント
├── features/             # Feature-based Architecture
│   ├── review/           # コードレビュー機能
│   ├── project/          # プロジェクト管理機能
│   └── profile/          # ユーザープロフィール機能
├── lib/                  # ライブラリ・ユーティリティ
│   ├── api-helpers.ts    # API統一実装パターン
│   ├── auth.ts           # NextAuth.js設定
│   ├── db.ts             # Prisma設定
│   ├── validation/       # Zodスキーマ（Centralized）
│   └── hooks/            # 共通カスタムフック
└── types/               # グローバル型定義
```

### Feature-based モジュール構造
```
src/features/[feature]/
├── components/          # UI コンポーネント
├── hooks/              # カスタムフック（API呼び出し・状態管理）
├── repositories/       # データアクセス層 (.server.ts)
├── services/           # ビジネスロジック (.server.ts)
├── schemas/            # バリデーション（lib/validation推奨）
└── stores/             # Zustand ストア（必要時）
```

## レイヤー設計

### 1. プレゼンテーション層（Presentation Layer）

#### Server/Client コンポーネントの分離
```typescript
// Server Component (page.tsx)
export default async function ReviewsPage() {
    const session = await getServerSession(authOptions);
    return <ReviewsPageClient session={session} />;
}

// Client Component (*Client.tsx)
"use client";
export function ReviewsPageClient({ session }: { session: Session | null }) {
    const { reviews, loading } = useReviews();
    // インタラクティブなロジック
}
```

### 2. アプリケーション層（Application Layer）

#### Service Layer実装
```typescript
// features/review/services/review.service.server.ts
export const reviewServiceServer = {
  async createReview(input: CreateReviewInput, userId: string) {
    // バリデーション
    const validatedInput = createReviewSchema.parse(input);

    // ビジネスロジック
    const review = await reviewRepositoryServer.createReview(validatedInput, userId);

    // AI処理
    const aiResult = await this.processAIReview(review);

    return convertToReview(review, aiResult);
  }
};
```

#### データベースアクセスの厳格なルール

**絶対に守るべき原則:**
1. **APIルート（`app/api/**/route.ts`）からの直接DB操作は完全に禁止**
2. **すべてのDB操作はRepository層（`repositories/*.server.ts`）に限定**
3. **APIルートはService層（`services/*.server.ts`）のみを呼び出す**
4. **Service層はRepository層のみを呼び出す**

```typescript
// ❌ 禁止: APIルートでの直接DB操作
export const GET = withAuth(async (request, user) => {
  const reviews = await db.review.findMany(); // ← 絶対に禁止！
});

// ✅ 正しい: Service層経由のアクセス
export const GET = withAuth(async (request, user) => {
  const reviews = await reviewServiceServer.getReviews(); // ← 正しい
});
```

### 3. インフラストラクチャ層（Infrastructure Layer）

#### Repository Pattern実装
```typescript
// features/review/repositories/review.repository.server.ts
export const reviewRepositoryServer = {
  async createReview(input: CreateReviewInput, userId: string) {
    return await db.review.create({
      data: {
        ...input,
        userId,
      },
      include: {
        user: true,
      }
    });
  },

  async findManyWithPagination(options: ReviewQueryOptions) {
    const { page, limit, language, userId } = options;

    return await db.review.findMany({
      where: {
        ...(language && { language }),
        ...(userId && { userId }),
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }
};
```

## データフロー

### 標準的なデータフロー
```
1. User Input (UI Component)
   ↓
2. Event Handler (Client Component)
   ↓
3. Custom Hook (useFeature)
   ↓
4. API Route (withAuth + API Helper)
   ↓
5. Service Method (.server.ts)
   ↓
6. Repository Method (.server.ts)
   ↓
7. Prisma + Database
   ↓
8. Response Processing
   ↓
9. State Update (Hook)
   ↓
10. UI Re-rendering (React)
```

## コード品質保証

### 実装ルール
- **API Helper関数必須**: withAuth, withParamsValidation等
- **Centralized Schema**: lib/validation からのimport必須
- **Feature-based構成**: 機能ごとのディレクトリ分割
- **Repository→Service→API→UI**: 明確な層分離
- **統一エラーハンドリング**: createApiErrorResponse使用

### TypeScript活用
- **厳格な型チェック**: strict モード有効
- **Prisma型統合**: データベース型との連携
- **Zod統合**: Runtime + Compile time バリデーション
