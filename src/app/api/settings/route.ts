/**
 * 設定API
 * GET /api/settings - 設定取得
 * PUT /api/settings - 設定更新
 */
import { NextRequest } from "next/server";
import { settingsService } from "@/features/settings/services/settingsService.server";
import { updateSettingsSchema } from "@/lib/validation/settings";
import {
  createSuccessResponse,
  validateRequestBody,
  handleApiError,
} from "@/lib/api-helpers";
import { ERROR_MESSAGES } from "@/lib/constants";

/**
 * GET /api/settings - 設定取得
 */
export async function GET() {
  try {
    const settings = await settingsService.get();
    return createSuccessResponse(settings);
  } catch (error) {
    console.error(ERROR_MESSAGES.SETTINGS.FETCH_FAILED, error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/settings - 設定更新
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const validation = validateRequestBody(updateSettingsSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const setting = await settingsService.update(validation.data);
    return createSuccessResponse(setting);
  } catch (error) {
    console.error(ERROR_MESSAGES.SETTINGS.UPDATE_FAILED, error);
    return handleApiError(error);
  }
}
