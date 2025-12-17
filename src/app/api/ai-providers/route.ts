/**
 * AIプロバイダーAPI
 * GET  /api/ai-providers - プロバイダー一覧取得
 * POST /api/ai-providers - プロバイダー作成
 */
import { NextRequest } from "next/server";
import { aiProviderService } from "@/features/ai-provider/services/aiProviderService.server";
import { createAIProviderSchema } from "@/lib/validation/ai-provider";
import {
  createSuccessResponse,
  validateRequestBody,
  handleApiError,
} from "@/lib/api-helpers";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

/**
 * GET /api/ai-providers - プロバイダー一覧取得
 */
export async function GET() {
  try {
    const providers = await aiProviderService.getAll();
    return createSuccessResponse(providers);
  } catch (error) {
    console.error("Failed to fetch AI providers:", error);
    return handleApiError(error);
  }
}

/**
 * POST /api/ai-providers - プロバイダー作成
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = validateRequestBody(createAIProviderSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const provider = await aiProviderService.create(validation.data);
    return createSuccessResponse(provider, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error(ERROR_MESSAGES.AI_PROVIDER.CREATE_FAILED, error);
    return handleApiError(error);
  }
}
