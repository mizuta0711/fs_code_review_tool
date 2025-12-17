# Prisma ORM 開発ガイド

## 概要

FSCodeReviewToolは Prisma ORM を使用してデータベース操作を行います。

## セットアップ

### インストール

```bash
npm install prisma @prisma/client
npx prisma init
```

### 設定ファイル

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Prismaクライアント設定

```typescript
// lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

## スキーマ設計

### ユーザーモデル

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  reviews       Review[]
  projects      Project[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### レビューモデル

```prisma
model Review {
  id          String   @id @default(cuid())
  title       String
  code        String   @db.Text
  language    String
  result      String?  @db.Text
  score       Int?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  projectId   String?
  project     Project? @relation(fields: [projectId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([projectId])
  @@index([createdAt])
}
```

### プロジェクトモデル

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviews     Review[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}
```

## Repository Pattern

### Repository実装

```typescript
// features/review/repositories/review.repository.server.ts
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export const reviewRepositoryServer = {
  /**
   * レビューを作成
   */
  async create(data: Prisma.ReviewCreateInput) {
    return await db.review.create({
      data,
      include: {
        user: true,
        project: true,
      },
    });
  },

  /**
   * IDでレビューを取得
   */
  async findById(id: string) {
    return await db.review.findUnique({
      where: { id },
      include: {
        user: true,
        project: true,
      },
    });
  },

  /**
   * ユーザーのレビュー一覧を取得
   */
  async findManyByUserId(userId: string, options?: {
    page?: number;
    limit?: number;
    language?: string;
  }) {
    const { page = 1, limit = 10, language } = options || {};

    return await db.review.findMany({
      where: {
        userId,
        ...(language && { language }),
      },
      include: {
        user: true,
        project: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
  },

  /**
   * レビューを更新
   */
  async update(id: string, data: Prisma.ReviewUpdateInput) {
    return await db.review.update({
      where: { id },
      data,
      include: {
        user: true,
        project: true,
      },
    });
  },

  /**
   * レビューを削除
   */
  async delete(id: string) {
    return await db.review.delete({
      where: { id },
    });
  },

  /**
   * レビュー数を取得
   */
  async count(userId: string) {
    return await db.review.count({
      where: { userId },
    });
  },
};
```

## CRUD操作

### Create（作成）

```typescript
// 単一レコード作成
const review = await db.review.create({
  data: {
    title: "新規レビュー",
    code: "console.log('Hello');",
    language: "typescript",
    userId: user.id,
  },
});

// リレーション付き作成
const review = await db.review.create({
  data: {
    title: "新規レビュー",
    code: "console.log('Hello');",
    language: "typescript",
    user: {
      connect: { id: user.id },
    },
    project: {
      connect: { id: projectId },
    },
  },
});

// 複数レコード作成
const reviews = await db.review.createMany({
  data: [
    { title: "レビュー1", code: "...", language: "typescript", userId: user.id },
    { title: "レビュー2", code: "...", language: "javascript", userId: user.id },
  ],
});
```

### Read（読み取り）

```typescript
// 単一レコード取得
const review = await db.review.findUnique({
  where: { id },
});

// 条件付き取得
const review = await db.review.findFirst({
  where: {
    userId: user.id,
    language: "typescript",
  },
});

// 複数レコード取得
const reviews = await db.review.findMany({
  where: { userId: user.id },
  orderBy: { createdAt: "desc" },
  take: 10,
  skip: 0,
});

// リレーション付き取得
const review = await db.review.findUnique({
  where: { id },
  include: {
    user: true,
    project: true,
  },
});

// 特定フィールドのみ取得
const review = await db.review.findUnique({
  where: { id },
  select: {
    id: true,
    title: true,
    language: true,
  },
});
```

### Update（更新）

```typescript
// 単一レコード更新
const review = await db.review.update({
  where: { id },
  data: {
    title: "更新後のタイトル",
    result: "レビュー結果",
    score: 85,
  },
});

// 複数レコード更新
const result = await db.review.updateMany({
  where: { userId: user.id },
  data: { score: 0 },
});

// upsert（存在しなければ作成）
const review = await db.review.upsert({
  where: { id },
  update: { title: "更新" },
  create: { title: "新規", code: "...", language: "typescript", userId: user.id },
});
```

### Delete（削除）

```typescript
// 単一レコード削除
const review = await db.review.delete({
  where: { id },
});

// 複数レコード削除
const result = await db.review.deleteMany({
  where: { userId: user.id },
});
```

## クエリ最適化

### N+1問題の回避

```typescript
// ❌ N+1問題が発生
const reviews = await db.review.findMany();
for (const review of reviews) {
  const user = await db.user.findUnique({ where: { id: review.userId } });
}

// ✅ include を使用
const reviews = await db.review.findMany({
  include: { user: true },
});
```

### インデックスの活用

```prisma
model Review {
  id        String   @id @default(cuid())
  userId    String
  language  String
  createdAt DateTime @default(now())

  // インデックス定義
  @@index([userId])
  @@index([language])
  @@index([createdAt])
  @@index([userId, language])  // 複合インデックス
}
```

### ページネーション

```typescript
// カーソルベースページネーション（推奨）
const reviews = await db.review.findMany({
  take: 10,
  cursor: lastReviewId ? { id: lastReviewId } : undefined,
  skip: lastReviewId ? 1 : 0,
  orderBy: { createdAt: "desc" },
});

// オフセットベースページネーション
const reviews = await db.review.findMany({
  take: 10,
  skip: (page - 1) * 10,
  orderBy: { createdAt: "desc" },
});
```

## トランザクション

```typescript
// インタラクティブトランザクション
const result = await db.$transaction(async (tx) => {
  const review = await tx.review.create({
    data: { title: "新規", code: "...", language: "typescript", userId: user.id },
  });

  await tx.user.update({
    where: { id: user.id },
    data: { reviewCount: { increment: 1 } },
  });

  return review;
});

// バッチトランザクション
const [review, user] = await db.$transaction([
  db.review.create({ data: { ... } }),
  db.user.update({ where: { id: user.id }, data: { ... } }),
]);
```

## マイグレーション

### 開発環境

```bash
# スキーマ変更をDBに反映（開発用）
npx prisma db push

# マイグレーション作成
npx prisma migrate dev --name add_review_model

# マイグレーション実行
npx prisma migrate deploy
```

### 本番環境

```bash
# マイグレーション実行
npx prisma migrate deploy

# Prismaクライアント生成
npx prisma generate
```

## 型定義

### Prisma型の活用

```typescript
import { Prisma, Review as PrismaReview } from "@prisma/client";

// 入力型
type CreateReviewInput = Prisma.ReviewCreateInput;
type UpdateReviewInput = Prisma.ReviewUpdateInput;

// リレーション付き型
type ReviewWithUser = Prisma.ReviewGetPayload<{
  include: { user: true };
}>;

// カスタム型
type ReviewListItem = Pick<PrismaReview, "id" | "title" | "language" | "createdAt">;
```

## エラーハンドリング

```typescript
import { Prisma } from "@prisma/client";

try {
  const review = await db.review.create({ data: { ... } });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      // ユニーク制約違反
      throw new Error("既に存在するレコードです");
    }
    if (error.code === "P2025") {
      // レコードが見つからない
      throw new Error("レコードが見つかりません");
    }
  }
  throw error;
}
```

## 参考リンク

- [Prisma ドキュメント](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
