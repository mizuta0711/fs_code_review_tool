/**
 * AIプロバイダー関連のバリデーションスキーマ
 */
import { z } from "zod";
import { AI_PROVIDERS, VALID_AI_PROVIDERS, ERROR_MESSAGES } from "@/lib/constants";

/**
 * AIプロバイダー種別のenum型
 */
const aiProviderValues = [
  AI_PROVIDERS.GEMINI,
  AI_PROVIDERS.AZURE_OPENAI,
  AI_PROVIDERS.CLAUDE,
] as const;

/**
 * AIプロバイダー作成用スキーマ
 */
export const createAIProviderSchema = z.object({
  name: z
    .string()
    .min(1, ERROR_MESSAGES.AI_PROVIDER.NAME_REQUIRED)
    .max(100, "表示名は100文字以内で入力してください")
    .transform((s) => s.trim()),
  provider: z.enum(aiProviderValues, {
    message: ERROR_MESSAGES.SETTINGS.INVALID_PROVIDER(VALID_AI_PROVIDERS),
  }),
  apiKey: z
    .string()
    .min(1, ERROR_MESSAGES.AI_PROVIDER.API_KEY_REQUIRED),
  endpoint: z.string().url().optional().or(z.literal("")),
  deployment: z.string().optional(),
  model: z.string().optional(),
  password: z
    .string()
    .min(1, ERROR_MESSAGES.AI_PROVIDER.PASSWORD_REQUIRED)
    .min(4, "パスワードは4文字以上で入力してください"),
});

/**
 * AIプロバイダー更新用スキーマ
 */
export const updateAIProviderSchema = z.object({
  name: z
    .string()
    .min(1, "表示名は空にできません")
    .max(100, "表示名は100文字以内で入力してください")
    .transform((s) => s.trim())
    .optional(),
  provider: z.enum(aiProviderValues, {
    message: ERROR_MESSAGES.SETTINGS.INVALID_PROVIDER(VALID_AI_PROVIDERS),
  }).optional(),
  apiKey: z.string().min(1).optional(),
  endpoint: z.string().url().nullable().optional().or(z.literal("")),
  deployment: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  password: z
    .string()
    .min(4, "パスワードは4文字以上で入力してください")
    .optional(),
});

// 型エクスポート
export type CreateAIProviderInput = z.infer<typeof createAIProviderSchema>;
export type UpdateAIProviderInput = z.infer<typeof updateAIProviderSchema>;
