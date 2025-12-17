# カラーシステム

## 概要

FSCodeReviewToolのカラーシステムは、Tailwind CSS と shadcn/ui のカラーパレットをベースにしています。

## ベースカラー

### グレースケール

| 用途 | クラス | 説明 |
|-----|-------|------|
| 背景（明） | `bg-white` | メイン背景 |
| 背景（暗） | `bg-gray-50` | セカンダリ背景 |
| ボーダー | `border-gray-200` | 標準ボーダー |
| テキスト（主） | `text-gray-900` | メインテキスト |
| テキスト（副） | `text-gray-600` | サブテキスト |
| テキスト（薄） | `text-gray-400` | プレースホルダー |

### プライマリカラー

```css
/* ブルー系 - メインアクション */
primary: {
  50:  '#eff6ff',  /* 背景 */
  100: '#dbeafe',  /* ホバー背景 */
  500: '#3b82f6',  /* メインカラー */
  600: '#2563eb',  /* ホバー */
  700: '#1d4ed8',  /* アクティブ */
}
```

### セマンティックカラー

```css
/* 成功 - グリーン */
success: {
  50:  '#f0fdf4',
  500: '#22c55e',
  600: '#16a34a',
}

/* 警告 - イエロー */
warning: {
  50:  '#fefce8',
  500: '#eab308',
  600: '#ca8a04',
}

/* エラー - レッド */
error: {
  50:  '#fef2f2',
  500: '#ef4444',
  600: '#dc2626',
}

/* 情報 - ブルー */
info: {
  50:  '#eff6ff',
  500: '#3b82f6',
  600: '#2563eb',
}
```

## 使用例

### 背景色

```tsx
// メイン背景
<div className="bg-white">コンテンツ</div>

// セカンダリ背景
<div className="bg-gray-50">コンテンツ</div>

// プライマリ背景
<div className="bg-primary-50">コンテンツ</div>
```

### テキスト色

```tsx
// メインテキスト
<p className="text-gray-900">メインテキスト</p>

// サブテキスト
<p className="text-gray-600">サブテキスト</p>

// プレースホルダー
<p className="text-gray-400">プレースホルダー</p>
```

### ステータス表示

```tsx
// 成功
<div className="bg-green-50 text-green-700 border border-green-200">
  成功しました
</div>

// 警告
<div className="bg-yellow-50 text-yellow-700 border border-yellow-200">
  警告があります
</div>

// エラー
<div className="bg-red-50 text-red-700 border border-red-200">
  エラーが発生しました
</div>

// 情報
<div className="bg-blue-50 text-blue-700 border border-blue-200">
  お知らせ
</div>
```

### ボタン色

```tsx
// プライマリボタン
<button className="bg-primary-500 hover:bg-primary-600 text-white">
  送信
</button>

// セカンダリボタン
<button className="bg-gray-100 hover:bg-gray-200 text-gray-900">
  キャンセル
</button>

// 破壊的ボタン
<button className="bg-red-500 hover:bg-red-600 text-white">
  削除
</button>
```

## ダークモード

### 背景色

```tsx
<div className="bg-white dark:bg-gray-900">
  コンテンツ
</div>
```

### テキスト色

```tsx
<p className="text-gray-900 dark:text-gray-100">
  テキスト
</p>
```

### ボーダー色

```tsx
<div className="border-gray-200 dark:border-gray-700">
  コンテンツ
</div>
```

## アクセシビリティ

### コントラスト比

WCAG 2.1 AA準拠のコントラスト比を確保：

| 組み合わせ | コントラスト比 | 準拠 |
|----------|--------------|-----|
| `text-gray-900` on `bg-white` | 21:1 | AAA |
| `text-gray-600` on `bg-white` | 7.5:1 | AAA |
| `text-white` on `bg-primary-500` | 4.5:1 | AA |
| `text-white` on `bg-red-500` | 4.5:1 | AA |

### フォーカス状態

```tsx
<button className="focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  ボタン
</button>
```

## コードレビュー用カラー

### シンタックスハイライト

```css
/* コードブロック背景 */
code-bg: '#1e1e1e'

/* キーワード */
keyword: '#569cd6'  /* 青 */

/* 文字列 */
string: '#ce9178'  /* オレンジ */

/* コメント */
comment: '#6a9955'  /* 緑 */

/* 関数 */
function: '#dcdcaa'  /* 黄 */

/* 変数 */
variable: '#9cdcfe'  /* 水色 */
```

### レビューステータス

```css
/* 承認 */
approved: '#22c55e'  /* グリーン */

/* 変更要求 */
changes-requested: '#ef4444'  /* レッド */

/* 保留 */
pending: '#eab308'  /* イエロー */
```

## 参考リンク

- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors)
- [WCAG コントラスト比ガイドライン](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
