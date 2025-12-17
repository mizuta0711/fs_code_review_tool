# UI コンポーネント開発ガイド

## 概要

FSCodeReviewToolは shadcn/ui と Tailwind CSS を使用してUIを構築します。

## shadcn/ui セットアップ

### インストール

```bash
npx shadcn@latest init
```

### コンポーネント追加

```bash
# 基本コンポーネント
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add alert
npx shadcn@latest add badge
npx shadcn@latest add skeleton
npx shadcn@latest add tabs
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
```

## 基本コンポーネント

### Button

```tsx
import { Button } from "@/components/ui/button";

// バリエーション
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="link">Link</Button>

// サイズ
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>

// ローディング状態
<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  処理中...
</Button>
```

### Card

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>タイトル</CardTitle>
    <CardDescription>説明文</CardDescription>
  </CardHeader>
  <CardContent>
    <p>コンテンツ</p>
  </CardContent>
  <CardFooter>
    <Button>アクション</Button>
  </CardFooter>
</Card>
```

### Input

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">メールアドレス</Label>
  <Input
    id="email"
    type="email"
    placeholder="example@example.com"
  />
</div>

// エラー状態
<Input className="border-red-500" />
<p className="text-sm text-red-500">エラーメッセージ</p>
```

### Textarea

```tsx
import { Textarea } from "@/components/ui/textarea";

<div className="space-y-2">
  <Label htmlFor="code">コード</Label>
  <Textarea
    id="code"
    placeholder="コードを入力..."
    className="font-mono h-64"
  />
</div>
```

### Select

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

<Select>
  <SelectTrigger>
    <SelectValue placeholder="言語を選択" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="typescript">TypeScript</SelectItem>
    <SelectItem value="javascript">JavaScript</SelectItem>
    <SelectItem value="python">Python</SelectItem>
  </SelectContent>
</Select>
```

### Dialog

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>ダイアログを開く</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>タイトル</DialogTitle>
      <DialogDescription>
        説明文
      </DialogDescription>
    </DialogHeader>
    <div className="py-4">
      コンテンツ
    </div>
    <DialogFooter>
      <Button variant="outline">キャンセル</Button>
      <Button>確認</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Alert

```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

// 情報
<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>お知らせ</AlertTitle>
  <AlertDescription>
    情報メッセージ
  </AlertDescription>
</Alert>

// 成功
<Alert className="border-green-500 text-green-700">
  <CheckCircle2 className="h-4 w-4" />
  <AlertTitle>成功</AlertTitle>
  <AlertDescription>
    処理が完了しました
  </AlertDescription>
</Alert>

// エラー
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>エラー</AlertTitle>
  <AlertDescription>
    エラーが発生しました
  </AlertDescription>
</Alert>
```

### Badge

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>デフォルト</Badge>
<Badge variant="secondary">セカンダリ</Badge>
<Badge variant="outline">アウトライン</Badge>
<Badge variant="destructive">破壊的</Badge>
```

### Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton";

// ローディング状態
<div className="space-y-4">
  <Skeleton className="h-8 w-[200px]" />
  <Skeleton className="h-4 w-[300px]" />
  <Skeleton className="h-4 w-[250px]" />
</div>

// カードスケルトン
<Card>
  <CardHeader>
    <Skeleton className="h-6 w-[150px]" />
    <Skeleton className="h-4 w-[200px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-20 w-full" />
  </CardContent>
</Card>
```

## フォーム実装

### React Hook Form + Zod

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const reviewSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  code: z.string().min(1, "コードは必須です"),
  language: z.string().min(1, "言語を選択してください"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export function ReviewForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
  });

  const onSubmit = async (data: ReviewFormData) => {
    // フォーム送信処理
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">タイトル</Label>
        <Input
          id="title"
          {...register("title")}
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">コード</Label>
        <Textarea
          id="code"
          {...register("code")}
          className={`font-mono h-64 ${errors.code ? "border-red-500" : ""}`}
        />
        {errors.code && (
          <p className="text-sm text-red-500">{errors.code.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            送信中...
          </>
        ) : (
          "レビュー依頼"
        )}
      </Button>
    </form>
  );
}
```

## 共通コンポーネント

### LoadingSpinner

```tsx
// components/common/LoadingSpinner.tsx
import { Loader2 } from "lucide-react";
import { memo } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner = memo(({ size = "md", className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
    </div>
  );
});
```

### EmptyState

```tsx
// components/common/EmptyState.tsx
import { memo } from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = memo(({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
});
```

### ErrorMessage

```tsx
// components/common/ErrorMessage.tsx
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { memo } from "react";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage = memo(({ title = "エラー", message, onRetry }: ErrorMessageProps) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            再試行
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
});
```

## レイアウトコンポーネント

### Header

```tsx
// components/layout/Header.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signIn, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          FSCodeReviewTool
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/reviews" className="text-gray-600 hover:text-gray-900">
            レビュー
          </Link>
          <Link href="/projects" className="text-gray-600 hover:text-gray-900">
            プロジェクト
          </Link>

          {session ? (
            <>
              <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                プロフィール
              </Link>
              <Button variant="outline" onClick={() => signOut()}>
                ログアウト
              </Button>
            </>
          ) : (
            <Button onClick={() => signIn()}>
              ログイン
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
```

## アイコン（Lucide React）

```tsx
import {
  Code,
  FileCode,
  Star,
  Trash2,
  Edit,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

// 使用例
<Button>
  <Plus className="mr-2 h-4 w-4" />
  新規作成
</Button>

<Button variant="ghost" size="icon">
  <Search className="h-4 w-4" />
</Button>
```

## ベストプラクティス

### 1. コンポーネント設計

- **単一責任**: 1つのコンポーネントは1つの役割
- **メモ化**: `memo` でパフォーマンス最適化
- **Props最小化**: 必要最小限のpropsのみ

### 2. スタイリング

- **Tailwind CSS優先**: インラインスタイルは避ける
- **一貫性**: デザインシステムに従う
- **レスポンシブ**: モバイルファースト

### 3. アクセシビリティ

- **キーボード操作**: Tab/Enterでの操作対応
- **ARIA属性**: 適切なアクセシビリティ属性
- **コントラスト**: 適切なカラーコントラスト

## 参考リンク

- [shadcn/ui ドキュメント](https://ui.shadcn.com/)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/icons)
- [React Hook Form](https://react-hook-form.com/)
