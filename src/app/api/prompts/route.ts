/**
 * プロンプトAPI
 * GET  /api/prompts - プロンプト一覧取得
 * POST /api/prompts - プロンプト作成
 */
import { NextRequest } from "next/server";
import { promptService } from "@/features/prompt/services/promptService.server";
import { createPromptSchema } from "@/lib/validation/prompt";
import {
  createSuccessResponse,
  validateRequestBody,
  handleApiError,
} from "@/lib/api-helpers";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/prompts - プロンプト一覧取得
 */
export async function GET() {
  try {
    const prompts = await promptService.getAll();
    return createSuccessResponse(prompts);
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
    return handleApiError(error);
  }
}

/**
 * POST /api/prompts - プロンプト作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = validateRequestBody(createPromptSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const prompt = await promptService.create(validation.data);
    return createSuccessResponse(prompt, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error(ERROR_MESSAGES.PROMPT.CREATE_FAILED, error);
    return handleApiError(error);
  }
}
