/**
 * 設定Repository
 * データアクセス層 - Prismaを使用した設定のCRUD操作
 */
import { prisma } from "@/lib/prisma";
import type { Setting } from "@prisma/client";
import { DEFAULTS } from "@/lib/constants";
import type { UpdateSettingsInput } from "@/lib/validation/settings";

/**
 * 設定Repository
 */
export const settingsRepository = {
  /**
   * 設定を取得（存在しない場合は作成）
   * @returns 設定
   */
  findOrCreate: async (): Promise<Setting> => {
    let setting = await prisma.setting.findUnique({
      where: { id: DEFAULTS.SETTINGS_ID },
    });

    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          id: DEFAULTS.SETTINGS_ID,
          aiProvider: DEFAULTS.AI_PROVIDER,
        },
      });
    }

    return setting;
  },

  /**
   * 設定を取得
   * @returns 設定、存在しない場合はnull
   */
  find: async (): Promise<Setting | null> => {
    return prisma.setting.findUnique({
      where: { id: DEFAULTS.SETTINGS_ID },
    });
  },

  /**
   * 設定を更新（存在しない場合は作成）
   * @param data 更新データ
   * @returns 更新された設定
   */
  upsert: async (data: UpdateSettingsInput): Promise<Setting> => {
    return prisma.setting.upsert({
      where: { id: DEFAULTS.SETTINGS_ID },
      update: {
        ...(data.aiProvider && { aiProvider: data.aiProvider }),
      },
      create: {
        id: DEFAULTS.SETTINGS_ID,
        aiProvider: data.aiProvider || DEFAULTS.AI_PROVIDER,
      },
    });
  },
};
