/**
 * 設定関連のバリデーションスキーマ
 */
import { z } from "zod";

/**
 * 設定更新用スキーマ
 */
export const updateSettingsSchema = z.object({
  activeProviderId: z.string().uuid().nullable().optional(),
});

// 型エクスポート
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
