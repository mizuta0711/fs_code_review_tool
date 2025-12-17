/**
 * レビューAPI
 * POST /api/review - コードレビュー実行
 */
import { NextRequest } from "next/server";
import { reviewService } from "@/features/review/services/reviewService.server";
import { reviewRequestSchema } from "@/lib/validation/review";
import {
  createSuccessResponse,
  validateRequestBody,
  handleApiError,
} from "@/lib/api-helpers";
import { ERROR_MESSAGES } from "@/lib/constants";

/**
 * POST /api/review - レビュー実行
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = validateRequestBody(reviewRequestSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const result = await reviewService.execute(validation.data);
    return createSuccessResponse(result);
  } catch (error) {
    console.error(ERROR_MESSAGES.REVIEW.FAILED, error);
    return handleApiError(error);
  }
}
