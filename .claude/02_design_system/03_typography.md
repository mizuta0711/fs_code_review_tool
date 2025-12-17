# タイポグラフィ

## 概要

FSCodeReviewToolのタイポグラフィシステムは、Tailwind CSS のタイポグラフィスケールをベースにしています。

## フォントファミリー

### 本文フォント

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### 等幅フォント（コード用）

```css
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

## フォントサイズスケール

| クラス | サイズ | 行高 | 用途 |
|-------|-------|-----|------|
| `text-xs` | 12px | 16px | 注釈、キャプション |
| `text-sm` | 14px | 20px | 補足テキスト |
| `text-base` | 16px | 24px | 本文 |
| `text-lg` | 18px | 28px | 強調本文 |
| `text-xl` | 20px | 28px | 小見出し |
| `text-2xl` | 24px | 32px | 中見出し |
| `text-3xl` | 30px | 36px | 大見出し |
| `text-4xl` | 36px | 40px | ページタイトル |

## フォントウェイト

| クラス | ウェイト | 用途 |
|-------|---------|------|
| `font-normal` | 400 | 本文 |
| `font-medium` | 500 | 強調本文、ラベル |
| `font-semibold` | 600 | 小見出し |
| `font-bold` | 700 | 見出し |

## 見出し

### h1 - ページタイトル

```tsx
<h1 className="text-3xl font-bold tracking-tight text-gray-900">
  ページタイトル
</h1>
```

### h2 - セクションタイトル

```tsx
<h2 className="text-2xl font-semibold text-gray-900">
  セクションタイトル
</h2>
```

### h3 - サブセクション

```tsx
<h3 className="text-xl font-semibold text-gray-900">
  サブセクション
</h3>
```

### h4 - 小見出し

```tsx
<h4 className="text-lg font-medium text-gray-900">
  小見出し
</h4>
```

## 本文テキスト

### 標準本文

```tsx
<p className="text-base text-gray-700 leading-relaxed">
  本文テキスト。読みやすい行間を設定しています。
</p>
```

### 補足テキスト

```tsx
<p className="text-sm text-gray-600">
  補足テキスト。
</p>
```

### キャプション

```tsx
<span className="text-xs text-gray-500">
  キャプション
</span>
```

## コードテキスト

### インラインコード

```tsx
<code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-gray-800">
  const example = "code";
</code>
```

### コードブロック

```tsx
<pre className="p-4 bg-gray-900 rounded-lg overflow-x-auto">
  <code className="text-sm font-mono text-gray-100">
    {`function hello() {
  console.log("Hello, World!");
}`}
  </code>
</pre>
```

## リンク

### 標準リンク

```tsx
<a href="#" className="text-primary-600 hover:text-primary-700 underline">
  リンクテキスト
</a>
```

### ナビゲーションリンク

```tsx
<a href="#" className="text-gray-700 hover:text-gray-900 font-medium">
  ナビゲーション
</a>
```

## リスト

### 順序なしリスト

```tsx
<ul className="list-disc list-inside space-y-2 text-gray-700">
  <li>アイテム1</li>
  <li>アイテム2</li>
  <li>アイテム3</li>
</ul>
```

### 順序付きリスト

```tsx
<ol className="list-decimal list-inside space-y-2 text-gray-700">
  <li>ステップ1</li>
  <li>ステップ2</li>
  <li>ステップ3</li>
</ol>
```

## テキストスタイル

### 強調

```tsx
<strong className="font-semibold">強調テキスト</strong>
```

### イタリック

```tsx
<em className="italic">イタリックテキスト</em>
```

### 取り消し線

```tsx
<del className="line-through text-gray-500">取り消しテキスト</del>
```

## 行間・文字間隔

### 行間

| クラス | 値 | 用途 |
|-------|-----|------|
| `leading-none` | 1 | タイトル |
| `leading-tight` | 1.25 | 見出し |
| `leading-normal` | 1.5 | 標準 |
| `leading-relaxed` | 1.625 | 本文 |
| `leading-loose` | 2 | ゆったり |

### 文字間隔

| クラス | 値 | 用途 |
|-------|-----|------|
| `tracking-tighter` | -0.05em | 大見出し |
| `tracking-tight` | -0.025em | 見出し |
| `tracking-normal` | 0 | 標準 |
| `tracking-wide` | 0.025em | 小文字強調 |

## テキスト配置

```tsx
// 左揃え（デフォルト）
<p className="text-left">左揃え</p>

// 中央揃え
<p className="text-center">中央揃え</p>

// 右揃え
<p className="text-right">右揃え</p>

// 両端揃え
<p className="text-justify">両端揃え</p>
```

## テキスト省略

### 1行省略

```tsx
<p className="truncate">
  長いテキストが省略されます...
</p>
```

### 複数行省略

```tsx
<p className="line-clamp-2">
  2行で省略される長いテキスト...
</p>

<p className="line-clamp-3">
  3行で省略される長いテキスト...
</p>
```

## レスポンシブタイポグラフィ

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  レスポンシブタイトル
</h1>

<p className="text-sm md:text-base">
  レスポンシブ本文
</p>
```

## 参考リンク

- [Tailwind CSS Typography](https://tailwindcss.com/docs/font-size)
- [Inter Font](https://fonts.google.com/specimen/Inter)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/)
