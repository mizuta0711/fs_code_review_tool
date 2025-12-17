/**
 * 設定関連のバリデーションスキーマ
 */
import { z } from "zod";
import { AI_PROVIDERS, VALID_AI_PROVIDERS, ERROR_MESSAGES } from "@/lib/constants";

/**
 * AIプロバイダーのenum型
 */
const aiProviderValues = [AI_PROVIDERS.GEMINI, AI_PROVIDERS.AZURE_OPENAI] as const;

/**
 * 設定更新用スキーマ
 */
export const updateSettingsSchema = z.object({
  aiProvider: z
    .enum(aiProviderValues, {
      message: ERROR_MESSAGES.SETTINGS.INVALID_PROVIDER(VALID_AI_PROVIDERS),
    })
    .optional(),
});

// 型エクスポート
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
