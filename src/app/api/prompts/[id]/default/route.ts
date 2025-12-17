/**
 * デフォルトプロンプト設定API
 * PUT /api/prompts/[id]/default - デフォルトプロンプトを設定
 */
import { NextRequest } from "next/server";
import { promptService } from "@/features/prompt/services/promptService.server";
import { createSuccessResponse, handleApiError } from "@/lib/api-helpers";
import { ERROR_MESSAGES } from "@/lib/constants";
import type { RouteParams } from "@/types/api";

/**
 * PUT /api/prompts/[id]/default - デフォルトプロンプト設定
 */
export async function PUT(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const prompt = await promptService.setDefault(id);
    return createSuccessResponse(prompt);
  } catch (error) {
    console.error(ERROR_MESSAGES.PROMPT.SET_DEFAULT_FAILED, error);
    return handleApiError(error);
  }
}
