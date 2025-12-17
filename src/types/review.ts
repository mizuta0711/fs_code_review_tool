/**
 * レビュー関連の型定義
 */

import type { AIProvider, CodeFile, ReviewedFile } from "@/lib/ai/types";

/**
 * レビューリクエストボディ
 */
export interface ReviewRequestBody {
  files: CodeFile[];
  promptId?: string;
}

/**
 * レビューレスポンス
 */
export interface ReviewApiResponse {
  reviewedFiles: ReviewedFile[];
  provider: AIProvider;
  promptId: string;
  promptName: string;
}

/**
 * レビュー結果（フロントエンド用）
 */
export interface ReviewResult {
  reviewedFiles: ReviewedFile[];
  provider: AIProvider;
  promptId: string;
  promptName: string;
  executedAt: Date;
}

// Re-export AI types for convenience
export type { AIProvider, CodeFile, ReviewedFile } from "@/lib/ai/types";
