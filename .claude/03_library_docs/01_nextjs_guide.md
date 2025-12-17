# Next.js 15 開発ガイド

## 概要

FSCodeReviewToolは Next.js 15 の App Router を使用したフルスタック Web アプリケーションです。

## ディレクトリ構造

```
src/
├── app/                     # Next.js 15 App Router
│   ├── api/                # API Routes
│   │   ├── reviews/        # レビュー関連API
│   │   ├── projects/       # プロジェクト関連API
│   │   └── auth/           # 認証関連API
│   ├── reviews/            # レビュー機能画面
│   ├── projects/           # プロジェクト機能画面
│   ├── profile/            # プロフィール機能画面
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # ホームページ
├── features/               # Feature-based Architecture
│   ├── review/             # レビュー機能
│   ├── project/            # プロジェクト機能
│   └── profile/            # プロフィール機能
├── components/             # 共通コンポーネント
│   ├── ui/                # shadcn/ui コンポーネント
│   └── common/            # 汎用コンポーネント
├── lib/                   # ライブラリ・設定
│   ├── api-helpers.ts     # API統一実装パターン
│   ├── auth.ts            # NextAuth.js設定
│   ├── db.ts              # Prisma設定
│   └── validation/        # Zod スキーマ
└── types/                 # TypeScript 型定義
```

## Server Component / Client Component 分離

### Server Component（page.tsx）

```typescript
// app/reviews/page.tsx - Server Component
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ReviewsPageClient } from "./ReviewsPageClient";

export default async function ReviewsPage() {
  // サーバーサイドでセッション取得
  const session = await getServerSession(authOptions);

  return <ReviewsPageClient session={session} />;
}

export const metadata: Metadata = {
  title: 'レビュー一覧 | FSCodeReviewTool',
  description: 'コードレビュー一覧',
};
```

### Client Component（*Client.tsx）

```typescript
// app/reviews/ReviewsPageClient.tsx - Client Component
"use client";

import { Session } from "next-auth";
import { Suspense } from "react";
import { ReviewList } from "@/features/review/components/ReviewList";

interface ReviewsPageClientProps {
  session: Session | null;
}

export function ReviewsPageClient({ session }: ReviewsPageClientProps) {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<ReviewListSkeleton />}>
        <ReviewList session={session} />
      </Suspense>
    </div>
  );
}
```

## Dynamic Routes（Next.js 15 Parameters as Promises 対応）

### パラメータ処理パターン

```typescript
// app/reviews/[id]/page.tsx
import { ReviewDetailClient } from "./ReviewDetailClient";

// Next.js 15: params は Promise<T>
export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ReviewDetailClient reviewId={id} />;
}

// generateMetadata も同様
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // メタデータ生成ロジック
}
```

## API Routes実装

### API Helper Functions

```typescript
// lib/api-helpers.ts
export const withAuth = (handler: AuthenticatedHandler) => {
  return async (request: NextRequest) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ error: "認証が必要です" }, { status: 401 });
    }
    return handler(request, session.user);
  };
};

export const withParamsValidation = (schema: ZodSchema, handler: Handler) => {
  return async (request: NextRequest, context: { params: Promise<unknown> }) => {
    const params = await context.params;
    const result = schema.safeParse(params);
    if (!result.success) {
      return Response.json({ error: "パラメータが不正です" }, { status: 400 });
    }
    return handler(request, result.data);
  };
};

export const validateRequestBody = async <T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> => {
  const body = await request.json();
  return schema.parse(body);
};

export const createApiErrorResponse = (
  error: unknown,
  message: string
): Response => {
  console.error(message, error);
  return Response.json(
    { error: message },
    { status: error instanceof Error ? 400 : 500 }
  );
};
```

### API Route実装例

```typescript
// app/api/reviews/route.ts
import { withAuth } from "@/lib/api-helpers";
import { validateRequestBody } from "@/lib/api-helpers";
import { createReviewSchema } from "@/lib/validation";
import { reviewServiceServer } from "@/features/review/services/review.service.server";

async function handlePost(
  request: NextRequest,
  user: AuthenticatedUser
): Promise<Response> {
  try {
    // 統一バリデーション
    const validatedData = await validateRequestBody(request, createReviewSchema);

    // Service Layer呼び出し（直接DB操作は禁止）
    const review = await reviewServiceServer.createReview(validatedData, user.id);

    return Response.json(review);
  } catch (error) {
    return createApiErrorResponse(error, "レビューの作成に失敗しました");
  }
}

export const POST = withAuth(handlePost);
```

### パラメータ検証付きAPI

```typescript
// app/api/reviews/[id]/route.ts
import { withAuthAndParams } from "@/lib/api-helpers";
import { reviewParamsSchema } from "@/lib/validation";

export const GET = withAuthAndParams(
  reviewParamsSchema,
  async (request, user, params) => {
    const { id } = params; // 自動的にバリデーション済み

    const review = await reviewServiceServer.getReviewById(id, user.id);
    return Response.json(review);
  }
);
```

## 認証統合（NextAuth.js）

### 認証設定

```typescript
// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
```

### セッション使用パターン

```typescript
// Server Component での使用
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return <div>Protected content</div>;
}

// Client Component での使用
"use client";
import { useSession } from "next-auth/react";

export function ClientComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <div>Not authenticated</div>;

  return <div>Welcome {session.user?.name}</div>;
}
```

## カスタムフック

### データ取得フック

```typescript
// features/review/hooks/useReviews.ts
import { useCallback, useState } from "react";

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reviews");
      if (!response.ok) throw new Error("Failed to fetch reviews");

      const data = await response.json();
      setReviews(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reviews,
    isLoading,
    error,
    loadReviews,
  };
}
```

## パフォーマンス最適化

### React.memo + useCallback

```typescript
import { memo, useCallback } from "react";

export const ReviewCard = memo(({ review, onDelete }: ReviewCardProps) => {
  const handleDelete = useCallback(() => {
    onDelete(review.id);
  }, [review.id, onDelete]);

  return (
    <Card>
      <CardContent>
        <h3>{review.title}</h3>
        <Button onClick={handleDelete}>削除</Button>
      </CardContent>
    </Card>
  );
});
```

### 動的インポート

```typescript
import dynamic from "next/dynamic";

const CodeEditor = dynamic(
  () => import("@/features/review/components/CodeEditor"),
  {
    loading: () => <div>Loading...</div>,
    ssr: false,
  }
);
```

## SEO対応

### メタデータ設定

```typescript
// app/reviews/[id]/page.tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const review = await getReviewById(id);

  return {
    title: `${review.title} | FSCodeReviewTool`,
    description: review.summary || "コードレビュー詳細",
    openGraph: {
      title: review.title,
      description: review.summary,
      type: "article",
    },
  };
}
```

## ベストプラクティス

### 1. コンポーネント設計

- **Server/Client分離**: 適切な境界で分離
- **メモ化**: React.memo, useCallback, useMemoの活用
- **Props最小化**: 必要最小限のpropsを渡す

### 2. API設計

- **Helper関数使用**: withAuth, withParamsValidation等
- **エラーハンドリング統一**: createApiErrorResponse使用
- **バリデーション**: Centralized Schema パターン

### 3. パフォーマンス

- **Code Splitting**: 必要に応じた動的インポート
- **キャッシュ戦略**: 適切なキャッシュの活用

### 4. 開発効率

- **Feature-based構成**: 機能ごとの独立開発
- **型安全性**: TypeScript + Zod による厳格な型チェック
- **統一パターン**: 一貫性のある実装パターン
