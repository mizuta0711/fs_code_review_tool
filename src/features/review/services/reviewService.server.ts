/**
 * レビューService
 * ビジネスロジック層 - コードレビューのビジネスルールを実装
 */
import { promptService } from "@/features/prompt/services/promptService.server";
import { settingsService } from "@/features/settings/services/settingsService.server";
import { createAIClient } from "@/lib/ai";
import { NotFoundError, AppError } from "@/lib/api-helpers";
import { ERROR_MESSAGES, ERROR_CODES, HTTP_STATUS } from "@/lib/constants";
import type { AIProvider, CodeFile, ReviewedFile } from "@/lib/ai/types";
import type { ReviewRequestInput } from "@/lib/validation/review";

/**
 * レビュー結果の型
 */
export interface ReviewResult {
  reviewedFiles: ReviewedFile[];
  provider: AIProvider;
  promptId: string;
  promptName: string;
}

/**
 * レビューService
 */
export const reviewService = {
  /**
   * コードレビューを実行
   * @param input レビューリクエスト
   * @returns レビュー結果
   * @throws NotFoundError プロンプトが見つからない場合
   * @throws AppError AIクライアント初期化失敗、タイムアウト、レート制限など
   */
  execute: async (input: ReviewRequestInput): Promise<ReviewResult> => {
    // 1. プロンプトの取得
    const prompt = await getPrompt(input.promptId);

    // 2. AIプロバイダーの取得
    const aiProvider = await settingsService.getCurrentProvider() as AIProvider;

    // 3. AIクライアントの作成
    const client = createAIClientSafe(aiProvider);

    // 4. レビューの実行
    const result = await executeReview(client, input.files, prompt.content);

    return {
      reviewedFiles: result.reviewedFiles,
      provider: aiProvider,
      promptId: prompt.id,
      promptName: prompt.name,
    };
  },
};

/**
 * プロンプトを取得
 * @param promptId プロンプトID（未指定の場合はデフォルト）
 * @returns プロンプト
 */
async function getPrompt(promptId?: string) {
  if (promptId) {
    // 指定されたプロンプトを取得
    try {
      return await promptService.getById(promptId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(
          ERROR_MESSAGES.REVIEW.PROMPT_NOT_FOUND,
          ERROR_CODES.PROMPT_NOT_FOUND
        );
      }
      throw error;
    }
  }

  // デフォルトプロンプトを取得
  const defaultPrompt = await promptService.getDefault();
  if (!defaultPrompt) {
    throw new AppError(
      ERROR_MESSAGES.REVIEW.DEFAULT_PROMPT_NOT_SET,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.REVIEW_DEFAULT_PROMPT_NOT_SET
    );
  }

  return defaultPrompt;
}

/**
 * AIクライアントを安全に作成
 * @param provider AIプロバイダー
 * @returns AIクライアント
 */
function createAIClientSafe(provider: AIProvider) {
  try {
    return createAIClient(provider);
  } catch (error) {
    console.error("Failed to create AI client:", error);
    throw new AppError(
      ERROR_MESSAGES.REVIEW.AI_CLIENT_INIT_FAILED(provider),
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.REVIEW_AI_CLIENT_INIT_FAILED
    );
  }
}

/**
 * レビューを実行
 * @param client AIクライアント
 * @param files コードファイル
 * @param promptContent プロンプト内容
 * @returns レビュー結果
 */
async function executeReview(
  client: ReturnType<typeof createAIClient>,
  files: CodeFile[],
  promptContent: string
) {
  try {
    return await client.review({
      files,
      prompt: promptContent,
    });
  } catch (error) {
    // タイムアウトエラー
    if (error instanceof Error && error.message.includes("timeout")) {
      throw new AppError(
        ERROR_MESSAGES.REVIEW.TIMEOUT,
        HTTP_STATUS.GATEWAY_TIMEOUT,
        ERROR_CODES.REVIEW_TIMEOUT
      );
    }

    // レート制限エラー
    if (
      error instanceof Error &&
      (error.message.includes("rate") || error.message.includes("quota"))
    ) {
      throw new AppError(
        ERROR_MESSAGES.REVIEW.RATE_LIMITED,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        ERROR_CODES.REVIEW_RATE_LIMITED
      );
    }

    // その他のエラー
    console.error("Review failed:", error);
    throw new AppError(
      ERROR_MESSAGES.REVIEW.FAILED,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.REVIEW_FAILED
    );
  }
}
