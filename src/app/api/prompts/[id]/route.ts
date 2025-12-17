/**
 * プロンプト詳細API
 * GET    /api/prompts/[id] - プロンプト詳細取得
 * PUT    /api/prompts/[id] - プロンプト更新
 * DELETE /api/prompts/[id] - プロンプト削除
 */
import { NextRequest } from "next/server";
import { promptService } from "@/features/prompt/services/promptService.server";
import { updatePromptSchema } from "@/lib/validation/prompt";
import {
  createSuccessResponse,
  validateRequestBody,
  handleApiError,
} from "@/lib/api-helpers";
import { ERROR_MESSAGES } from "@/lib/constants";
import type { RouteParams } from "@/types/api";

/**
 * GET /api/prompts/[id] - プロンプト詳細取得
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const prompt = await promptService.getById(id);
    return createSuccessResponse(prompt);
  } catch (error) {
    console.error(ERROR_MESSAGES.PROMPT.FETCH_FAILED, error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/prompts/[id] - プロンプト更新
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // バリデーション
    const validation = validateRequestBody(updatePromptSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const prompt = await promptService.update(id, validation.data);
    return createSuccessResponse(prompt);
  } catch (error) {
    console.error(ERROR_MESSAGES.PROMPT.UPDATE_FAILED, error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/prompts/[id] - プロンプト削除
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    await promptService.delete(id);
    return createSuccessResponse({ message: "プロンプトを削除しました" });
  } catch (error) {
    console.error(ERROR_MESSAGES.PROMPT.DELETE_FAILED, error);
    return handleApiError(error);
  }
}
