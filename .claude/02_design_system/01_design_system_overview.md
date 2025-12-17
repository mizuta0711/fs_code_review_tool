# デザインシステム概要

## 概要

FSCodeReviewToolのデザインシステムは、一貫性のあるUIを実現するための設計原則とコンポーネントライブラリです。

## 技術スタック

- **UIライブラリ**: shadcn/ui
- **スタイリング**: Tailwind CSS v4
- **アイコン**: Lucide React
- **フォント**: Inter（デフォルト）

## デザイン原則

### 1. シンプルさ

- 必要最小限のUI要素
- 直感的なナビゲーション
- 明確な視覚的階層

### 2. 一貫性

- 統一されたカラーパレット
- 一貫したスペーシング
- 共通のコンポーネントパターン

### 3. アクセシビリティ

- 適切なコントラスト比
- キーボードナビゲーション対応
- スクリーンリーダー対応

### 4. レスポンシブ

- モバイルファーストアプローチ
- ブレークポイントの統一
- 適応的なレイアウト

## コンポーネント構成

### shadcn/ui コンポーネント

```
src/components/ui/
├── button.tsx          # ボタンコンポーネント
├── card.tsx            # カードコンポーネント
├── input.tsx           # 入力フィールド
├── textarea.tsx        # テキストエリア
├── select.tsx          # セレクトボックス
├── dialog.tsx          # モーダルダイアログ
├── alert.tsx           # アラート
├── badge.tsx           # バッジ
├── skeleton.tsx        # スケルトンローダー
└── ...
```

### 共通コンポーネント

```
src/components/common/
├── LoadingSpinner.tsx  # ローディングスピナー
├── ErrorMessage.tsx    # エラーメッセージ
├── EmptyState.tsx      # 空状態表示
└── ...
```

### レイアウトコンポーネント

```
src/components/layout/
├── Header.tsx          # ヘッダー
├── Footer.tsx          # フッター
├── Sidebar.tsx         # サイドバー
└── ...
```

## レスポンシブブレークポイント

Tailwind CSS のデフォルトブレークポイントを使用：

| ブレークポイント | 最小幅 | 用途 |
|--------------|-------|------|
| `sm` | 640px | スマートフォン（横向き） |
| `md` | 768px | タブレット |
| `lg` | 1024px | ラップトップ |
| `xl` | 1280px | デスクトップ |
| `2xl` | 1536px | 大画面デスクトップ |

## スペーシングシステム

Tailwind CSS のスペーシングスケールを使用：

| クラス | サイズ | 用途 |
|-------|-------|------|
| `p-1`, `m-1` | 4px | 極小間隔 |
| `p-2`, `m-2` | 8px | 小間隔 |
| `p-4`, `m-4` | 16px | 標準間隔 |
| `p-6`, `m-6` | 24px | 中間隔 |
| `p-8`, `m-8` | 32px | 大間隔 |
| `p-12`, `m-12` | 48px | 特大間隔 |

## シャドウシステム

```css
/* Tailwind CSS シャドウ */
shadow-sm    /* 小さいシャドウ */
shadow       /* 標準シャドウ */
shadow-md    /* 中程度のシャドウ */
shadow-lg    /* 大きいシャドウ */
shadow-xl    /* 特大シャドウ */
```

## ボーダーラディウス

```css
/* Tailwind CSS ボーダーラディウス */
rounded-sm   /* 2px */
rounded      /* 4px */
rounded-md   /* 6px */
rounded-lg   /* 8px */
rounded-xl   /* 12px */
rounded-2xl  /* 16px */
rounded-full /* 完全な円形 */
```

## 使用例

### ボタン

```tsx
import { Button } from "@/components/ui/button";

// プライマリボタン
<Button>送信</Button>

// セカンダリボタン
<Button variant="secondary">キャンセル</Button>

// アウトラインボタン
<Button variant="outline">詳細</Button>

// 破壊的アクション
<Button variant="destructive">削除</Button>
```

### カード

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>タイトル</CardTitle>
  </CardHeader>
  <CardContent>
    <p>コンテンツ</p>
  </CardContent>
</Card>
```

### フォーム

```tsx
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

<form className="space-y-4">
  <div>
    <label className="text-sm font-medium">タイトル</label>
    <Input placeholder="タイトルを入力" />
  </div>
  <div>
    <label className="text-sm font-medium">説明</label>
    <Textarea placeholder="説明を入力" />
  </div>
  <Button type="submit">保存</Button>
</form>
```

## アニメーション

### トランジション

```css
/* Tailwind CSS トランジション */
transition-all duration-200  /* 全プロパティ、200ms */
transition-colors duration-150  /* 色のみ、150ms */
transition-transform duration-300  /* 変形のみ、300ms */
```

### ホバーエフェクト

```tsx
// ホバー時にシャドウを追加
<div className="hover:shadow-lg transition-shadow">
  コンテンツ
</div>

// ホバー時に拡大
<div className="hover:scale-105 transition-transform">
  コンテンツ
</div>
```

## ダークモード対応

Tailwind CSS の `dark:` プレフィックスを使用：

```tsx
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  コンテンツ
</div>
```

## 参考リンク

- [shadcn/ui ドキュメント](https://ui.shadcn.com/)
- [Tailwind CSS ドキュメント](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/icons)
