/**
 * AIプロバイダー詳細API
 * GET    /api/ai-providers/[id] - プロバイダー詳細取得
 * PUT    /api/ai-providers/[id] - プロバイダー更新
 * DELETE /api/ai-providers/[id] - プロバイダー削除
 */
import { NextRequest } from "next/server";
import { aiProviderService } from "@/features/ai-provider/services/aiProviderService.server";
import { updateAIProviderSchema } from "@/lib/validation/ai-provider";
import {
  createSuccessResponse,
  validateRequestBody,
  handleApiError,
} from "@/lib/api-helpers";
import { ERROR_MESSAGES } from "@/lib/constants";
import type { RouteParams } from "@/types/api";

/**
 * GET /api/ai-providers/[id] - プロバイダー詳細取得
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const provider = await aiProviderService.getById(id);
    return createSuccessResponse(provider);
  } catch (error) {
    console.error(ERROR_MESSAGES.AI_PROVIDER.FETCH_FAILED, error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/ai-providers/[id] - プロバイダー更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // バリデーション
    const validation = validateRequestBody(updateAIProviderSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const provider = await aiProviderService.update(id, validation.data);
    return createSuccessResponse(provider);
  } catch (error) {
    console.error(ERROR_MESSAGES.AI_PROVIDER.UPDATE_FAILED, error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/ai-providers/[id] - プロバイダー削除
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await aiProviderService.delete(id);
    return createSuccessResponse({ message: "AIプロバイダーを削除しました" });
  } catch (error) {
    console.error(ERROR_MESSAGES.AI_PROVIDER.DELETE_FAILED, error);
    return handleApiError(error);
  }
}
