/**
 * 設定Service
 * ビジネスロジック層 - 設定管理のビジネスルールを実装
 */
import { settingsRepository } from "../repositories/settingsRepository.server";
import { AI_PROVIDERS } from "@/lib/constants";
import { logger, createTimer } from "@/lib/logger";
import type { Setting } from "@prisma/client";
import type { UpdateSettingsInput } from "@/lib/validation/settings";
import type { ProviderStatusMap, SettingsResponse } from "@/types/settings";

const SERVICE_NAME = "settingsService";

/**
 * プロバイダーの設定状態を取得
 * @returns プロバイダー状態マップ
 */
function getProviderStatus(): ProviderStatusMap {
  return {
    [AI_PROVIDERS.GEMINI]: {
      configured: !!process.env.GEMINI_API_KEY,
    },
    [AI_PROVIDERS.AZURE_OPENAI]: {
      configured: !!(
        process.env.AZURE_OPENAI_ENDPOINT &&
        process.env.AZURE_OPENAI_API_KEY &&
        process.env.AZURE_OPENAI_DEPLOYMENT
      ),
    },
  };
}

/**
 * 設定Service
 */
export const settingsService = {
  /**
   * 設定を取得（プロバイダー状態を含む）
   * @returns 設定とプロバイダー状態
   */
  get: async (): Promise<SettingsResponse> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "get");

    const setting = await settingsRepository.findOrCreate();
    const providerStatus = getProviderStatus();

    logger.serviceEnd(SERVICE_NAME, "get", timer.elapsed(), {
      provider: setting.aiProvider,
    });

    return {
      ...setting,
      providerStatus,
    };
  },

  /**
   * 設定を更新
   * @param input 更新データ
   * @returns 更新された設定
   */
  update: async (input: UpdateSettingsInput): Promise<Setting> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "update", { provider: input.aiProvider });

    const setting = await settingsRepository.upsert(input);

    logger.serviceEnd(SERVICE_NAME, "update", timer.elapsed());
    logger.info("Settings updated", { provider: setting.aiProvider });
    return setting;
  },

  /**
   * 現在のAIプロバイダーを取得
   * @returns AIプロバイダー名
   */
  getCurrentProvider: async (): Promise<string> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "getCurrentProvider");

    const setting = await settingsRepository.findOrCreate();

    logger.serviceEnd(SERVICE_NAME, "getCurrentProvider", timer.elapsed(), {
      provider: setting.aiProvider,
    });
    return setting.aiProvider;
  },

  /**
   * プロバイダー状態を取得
   * @returns プロバイダー状態マップ
   */
  getProviderStatus: (): ProviderStatusMap => {
    return getProviderStatus();
  },
};
