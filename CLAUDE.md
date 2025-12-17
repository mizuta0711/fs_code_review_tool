必ず日本語で回答してください。

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## メインエージェント単体による高パフォーマンス開発

このファイルは、FSCodeReviewTool 開発プロジェクトでの**メインエージェント単体による効率的な開発**を実現するための指針です。
専門エージェントは使用せず、メインエージェント（Claude Code）が直接実装を行います。

## メインエージェントの役割と責任

### 全般的な責任範囲
- **要件定義**: ユーザーとの仕様・タスクの認識合わせ
- **設計・実装**: アーキテクチャ設計からコード実装まで一貫対応
- **品質管理**: テスト実行・ビルド確認・コードレビュー
- **進捗管理**: タスクの優先順位付け・スケジュール管理
- **ドキュメント管理**: 仕様書・設計書の作成・更新

### 実装における推奨行動
- **段階的実装**: 機能を小さな単位に分割して実装
- **継続的確認**: 各段階でビルド・テスト・動作確認を実施
- **品質重視**: エラーフリー・型安全性・パフォーマンスを重視
- **ドキュメント同期**: 実装と同時にドキュメントを更新
- **既存パターン踏襲**: コードベースの既存パターンに従った実装

## プロジェクト概要

FSCodeReviewTool は、コードレビューを支援するWebアプリケーションです。
- **コードレビュー機能**: ソースコードのAIレビュー・改善提案
- **プロジェクト管理**: レビュー対象プロジェクトの管理
- **レビュー履歴**: 過去のレビュー結果の保存・参照
- **チーム機能**: 複数ユーザーでのコラボレーション

## ドキュメント構成

### プロジェクト要件 (.claude/00_project/)
- `01_project_requirements.md` - プロジェクトコンセプト、機能要件

### 技術設計ドキュメント (.claude/01_development_docs/)
- `01_architecture_design.md` - システムアーキテクチャの設計思想
- `02_database_design.md` - データベース設計
- `03_api_design.md` - RESTful API設計とエンドポイント定義
- `04_frontend_design.md` - フロントエンド設計とコンポーネント構成

### デザインシステム (.claude/02_design_system/)
- `01_design_system_overview.md` - デザインシステム概要
- `02_color_system.md` - カラーパレット、セマンティックカラー
- `03_typography.md` - タイポグラフィ設定

### ライブラリ開発ガイド (.claude/03_library_docs/)
- `01_nextjs_guide.md` - Next.js 15 App Router の実装パターン
- `02_prisma_guide.md` - Prisma ORM によるデータベース操作
- `03_ui_component_guide.md` - shadcn/ui + Tailwind CSS による UI 開発

## 技術スタック

### コア技術
- **フロントエンド**: React 19, Next.js 15 (App Router), TypeScript 5, Tailwind CSS v4
- **UIライブラリ**: shadcn/ui (予定)
- **状態管理**: Zustand (グローバル状態), React Hook Form (フォーム)
- **バックエンド**: Next.js 15 API Routes, Prisma ORM, PostgreSQL
- **認証**: NextAuth.js (GitHub/Google OAuth)
- **AI統合**: Google Gemini API / OpenAI API (コードレビュー)

### 開発ツール
- **リンター**: ESLint
- **フォーマッター**: Prettier
- **テスト**: Jest, React Testing Library
- **E2Eテスト**: Playwright

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# Lint
npm run lint

# 型チェック
npx tsc --noEmit
```

## 高パフォーマンス開発フロー

### 効率的なタスク管理
1. **要件分析**: ユーザー要求の詳細分析・技術要件への変換
2. **設計フェーズ**: アーキテクチャ・DB・API設計の策定
3. **実装計画**: 段階的実装プランの作成（TodoWrite活用）
4. **段階的実装**: 小単位での実装・確認・コミットサイクル
5. **品質確認**: ビルド・テスト・動作確認の実行
6. **完了報告**: 実装内容の要約・次ステップの提案

### 品質管理指針
- **コード品質**: TypeScript型安全性・ESLint準拠・パフォーマンス最適化
- **テスト網羅**: ユニットテスト・統合テスト・E2Eテスト実装
- **動作確認**: 実際のブラウザでの動作確認・レスポンシブ対応確認
- **セキュリティ**: 認証・認可・入力検証・XSS対策の実装

## アーキテクチャ原則

### 設計思想
- **Feature-based Architecture**: 機能ごとのディレクトリ分割による高凝集・低結合
- **Repository Pattern**: データアクセス層の抽象化
- **Service Layer**: ビジネスロジックの集約
- **Custom Hooks**: UI とロジックの分離
- **データアクセス層の分離**: APIルートからの直接DB操作は禁止

### ディレクトリ構造
```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API Routes
│   └── [pages]/           # ページコンポーネント
├── components/            # 共通コンポーネント
│   ├── ui/               # shadcn/ui コンポーネント
│   └── common/           # 汎用コンポーネント
├── features/             # Feature-based Architecture
│   └── [feature]/
│       ├── components/   # UI コンポーネント
│       ├── hooks/        # カスタムフック
│       ├── repositories/ # データアクセス層 (.server.ts)
│       └── services/     # ビジネスロジック (.server.ts)
├── lib/                  # ライブラリ・ユーティリティ
│   ├── api-helpers.ts    # API統一実装パターン
│   ├── auth.ts           # NextAuth.js設定
│   ├── db.ts             # Prisma設定
│   └── validation/       # Zodスキーマ
└── types/               # グローバル型定義
```

## 実装品質チェックリスト

### 必須確認事項（各実装完了時）
- [ ] **ビルドエラー**: `npm run build` が成功すること
- [ ] **Lintエラー**: `npm run lint` でエラーがないこと
- [ ] **型安全性**: TypeScriptエラーがないこと
- [ ] **動作確認**: 実際のブラウザで機能が正常動作すること
- [ ] **既存機能**: デグレードが発生していないこと

## エラー対処

### よくあるエラーと対処法

#### Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript エラー
```bash
npx tsc --noEmit
```

#### ビルドエラー
```bash
rm -rf .next
npm run build
```

#### データベース関連エラー
```bash
npx prisma generate
npx prisma db push
```

---

**重要**: 効率的な実装のため：
1. 必要最小限のファイル変更に留める
2. 各段階でビルド・テスト通過を確認する
3. 既存パターンに従った実装を心がける
