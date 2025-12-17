/**
 * AIプロバイダーパスワード検証API
 * POST /api/ai-providers/[id]/verify-password - パスワード検証
 */
import { NextRequest } from "next/server";
import { aiProviderService } from "@/features/ai-provider/services/aiProviderService.server";
import {
  createSuccessResponse,
  createErrorResponse,
  handleApiError,
} from "@/lib/api-helpers";
import { ERROR_MESSAGES, ERROR_CODES, HTTP_STATUS } from "@/lib/constants";
import type { RouteParams } from "@/types/api";

/**
 * POST /api/ai-providers/[id]/verify-password - パスワード検証
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return createErrorResponse(
        ERROR_MESSAGES.AI_PROVIDER.PASSWORD_REQUIRED,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    const isValid = await aiProviderService.verifyPassword(id, password);

    if (!isValid) {
      return createErrorResponse(
        ERROR_MESSAGES.AI_PROVIDER.PASSWORD_INVALID,
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_CODES.AI_PROVIDER_PASSWORD_INVALID
      );
    }

    return createSuccessResponse({ valid: true });
  } catch (error) {
    console.error("Password verification failed:", error);
    return handleApiError(error);
  }
}
