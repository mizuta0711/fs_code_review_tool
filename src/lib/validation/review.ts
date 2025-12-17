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
 * レビューリクエストスキーマ
 */
export const reviewRequestSchema = z.object({
  files: z
    .array(codeFileSchema)
    .min(1, ERROR_MESSAGES.REVIEW.FILES_REQUIRED),
  // promptIdは任意の文字列（空文字列はundefinedに変換）
  promptId: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  // パスワード認証用（AIプロバイダー利用時に必要）
  password: z.string().optional(),
});

// 型エクスポート
export type CodeFileInput = z.infer<typeof codeFileSchema>;
export type ReviewRequestInput = z.infer<typeof reviewRequestSchema>;
