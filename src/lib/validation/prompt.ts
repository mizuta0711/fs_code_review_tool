/**
 * プロンプト関連のバリデーションスキーマ
 */
import { z } from "zod";
import { VALIDATION, ERROR_MESSAGES } from "@/lib/constants";

/**
 * プロンプト作成用スキーマ
 */
export const createPromptSchema = z.object({
  name: z
    .string()
    .min(1, ERROR_MESSAGES.PROMPT.NAME_REQUIRED)
    .max(VALIDATION.PROMPT_NAME_MAX_LENGTH, ERROR_MESSAGES.PROMPT.NAME_TOO_LONG)
    .transform((s) => s.trim()),
  description: z
    .string()
    .max(VALIDATION.PROMPT_DESCRIPTION_MAX_LENGTH, ERROR_MESSAGES.PROMPT.DESCRIPTION_TOO_LONG)
    .optional()
    .transform((s) => s?.trim() || null),
  content: z
    .string()
    .min(1, ERROR_MESSAGES.PROMPT.CONTENT_REQUIRED)
    .max(VALIDATION.PROMPT_CONTENT_MAX_LENGTH, ERROR_MESSAGES.PROMPT.CONTENT_TOO_LONG)
    .transform((s) => s.trim()),
});

/**
 * プロンプト更新用スキーマ
 */
export const updatePromptSchema = z.object({
  name: z
    .string()
    .min(1, ERROR_MESSAGES.PROMPT.NAME_EMPTY)
    .max(VALIDATION.PROMPT_NAME_MAX_LENGTH, ERROR_MESSAGES.PROMPT.NAME_TOO_LONG)
    .transform((s) => s.trim())
    .optional(),
  description: z
    .string()
    .max(VALIDATION.PROMPT_DESCRIPTION_MAX_LENGTH, ERROR_MESSAGES.PROMPT.DESCRIPTION_TOO_LONG)
    .transform((s) => s?.trim() || null)
    .optional(),
  content: z
    .string()
    .min(1, ERROR_MESSAGES.PROMPT.CONTENT_EMPTY)
    .max(VALIDATION.PROMPT_CONTENT_MAX_LENGTH, ERROR_MESSAGES.PROMPT.CONTENT_TOO_LONG)
    .transform((s) => s.trim())
    .optional(),
});

// 型エクスポート
export type CreatePromptInput = z.infer<typeof createPromptSchema>;
export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;
