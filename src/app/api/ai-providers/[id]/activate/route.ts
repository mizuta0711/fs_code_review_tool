/**
 * AIプロバイダーアクティベートAPI
 * POST /api/ai-providers/[id]/activate - プロバイダーをアクティブ化
 */
import { NextRequest } from "next/server";
import { aiProviderService } from "@/features/ai-provider/services/aiProviderService.server";
import { createSuccessResponse, handleApiError } from "@/lib/api-helpers";
import { ERROR_MESSAGES } from "@/lib/constants";
import type { RouteParams } from "@/types/api";

/**
 * POST /api/ai-providers/[id]/activate - プロバイダーをアクティブ化
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const provider = await aiProviderService.setActive(id);
    return createSuccessResponse(provider);
  } catch (error) {
    console.error(ERROR_MESSAGES.AI_PROVIDER.ACTIVATE_FAILED, error);
    return handleApiError(error);
  }
}
