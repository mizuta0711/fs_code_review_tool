/**
 * レビュー関連のバリデーションスキーマ
 */
import { z } from "zod";
import { VALIDATION, ERROR_MESSAGES } from "@/lib/constants";

/**
 * コードファイルスキーマ
 */
export const codeFileSchema = z.object({
  name: z
    .string()
    .min(1, ERROR_MESSAGES.REVIEW.FILE_NAME_REQUIRED)
    .max(VALIDATION.FILE_NAME_MAX_LENGTH),
  language: z.string().default(""),
  content: z
    .string()
    .min(1, ERROR_MESSAGES.REVIEW.FILE_CONTENT_REQUIRED)
    .max(VALIDATION.FILE_CONTENT_MAX_LENGTH),
});

/**
 * オプショナルUUID（空文字列も許可）
 */
const optionalUuid = z.union([
  z.literal(""),
  z.string().uuid("無効なIDです"),
  z.undefined(),
]).transform((val) => (val === "" ? undefined : val));

/**
 * レビューリクエストスキーマ
 */
export const reviewRequestSchema = z.object({
  files: z
    .array(codeFileSchema)
    .min(1, ERROR_MESSAGES.REVIEW.FILES_REQUIRED),
  promptId: optionalUuid,
});

// 型エクスポート
export type CodeFileInput = z.infer<typeof codeFileSchema>;
export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;
