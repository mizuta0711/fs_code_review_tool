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
  createErrorResponse,
  validateRequestBody,
  handleApiError,
} from "@/lib/api-helpers";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";
import type { RouteParams } from "@/types/api";

/**
 * GET /api/ai-providers/[id] - プロバイダー詳細取得
 * パスワード付きプロバイダーの場合、クエリパラメータ ?password=xxx が必要
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const password = request.nextUrl.searchParams.get("password") || undefined;

    // パスワード検証が必要かチェック
    const needsPassword = await aiProviderService.hasPassword(id);
    if (needsPassword) {
      const isValid = await aiProviderService.verifyPassword(id, password);
      if (!isValid) {
        return createErrorResponse(
          "パスワードが正しくありません",
          HTTP_STATUS.UNAUTHORIZED
        );
      }
    }

    const provider = await aiProviderService.getById(id);
    return createSuccessResponse(provider);
  } catch (error) {
    console.error(ERROR_MESSAGES.AI_PROVIDER.FETCH_FAILED, error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/ai-providers/[id] - プロバイダー更新
 * パスワード付きプロバイダーの場合、currentPassword が必要
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

    // パスワード検証が必要かチェック
    const needsPassword = await aiProviderService.hasPassword(id);
    if (needsPassword) {
      const isValid = await aiProviderService.verifyPassword(id, validation.data.currentPassword);
      if (!isValid) {
        return createErrorResponse(
          "現在のパスワードが正しくありません",
          HTTP_STATUS.UNAUTHORIZED
        );
      }
    }

    // currentPassword は更新データから除外
    const { currentPassword: _, ...updateData } = validation.data;
    const provider = await aiProviderService.update(id, updateData);
    return createSuccessResponse(provider);
  } catch (error) {
    console.error(ERROR_MESSAGES.AI_PROVIDER.UPDATE_FAILED, error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/ai-providers/[id] - プロバイダー削除
 * パスワード付きプロバイダーの場合、クエリパラメータ ?password=xxx が必要
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const password = request.nextUrl.searchParams.get("password") || undefined;

    // パスワード検証が必要かチェック
    const needsPassword = await aiProviderService.hasPassword(id);
    if (needsPassword) {
      const isValid = await aiProviderService.verifyPassword(id, password);
      if (!isValid) {
        return createErrorResponse(
          "パスワードが正しくありません",
          HTTP_STATUS.UNAUTHORIZED
        );
      }
    }

    await aiProviderService.delete(id);
    return createSuccessResponse({ message: "AIプロバイダーを削除しました" });
  } catch (error) {
    console.error(ERROR_MESSAGES.AI_PROVIDER.DELETE_FAILED, error);
    return handleApiError(error);
  }
}
