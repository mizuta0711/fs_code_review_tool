/**
 * 共通バリデーションスキーマ
 */
import { z } from "zod";

/**
 * 基本的な共通スキーマ
 */
export const commonSchemas = {
  // UUID
  uuid: z.string().uuid("無効なIDです"),

  // 非空文字列（トリム付き）
  nonEmptyString: (fieldName: string, maxLength?: number) => {
    let schema = z
      .string()
      .min(1, `${fieldName}は必須です`)
      .transform((s) => s.trim());

    if (maxLength) {
      schema = schema.refine(
        (s) => s.length <= maxLength,
        `${fieldName}は${maxLength}文字以内で入力してください`
      );
    }

    return schema;
  },

  // オプショナル文字列（トリム付き、空文字はnullに変換）
  optionalString: (maxLength?: number) => {
    let schema = z
      .string()
      .optional()
      .transform((s) => s?.trim() || null);

    if (maxLength) {
      schema = schema.refine(
        (s) => s === null || s.length <= maxLength,
        `${maxLength}文字以内で入力してください`
      );
    }

    return schema;
  },

  // ページネーション
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

/**
 * ページネーション用スキーマ
 */
export const paginationSchema = z.object({
  page: commonSchemas.page,
  limit: commonSchemas.limit,
});

/**
 * IDパラメータ用スキーマ
 */
export const idParamsSchema = z.object({
  id: commonSchemas.uuid,
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParamsInput = z.infer<typeof idParamsSchema>;
