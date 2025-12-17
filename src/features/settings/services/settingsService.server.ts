/**
 * 設定Service
 * ビジネスロジック層 - 設定管理のビジネスルールを実装
 */
import { settingsRepository } from "../repositories/settingsRepository.server";
import { AI_PROVIDERS } from "@/lib/constants";
import type { Setting } from "@prisma/client";
import type { UpdateSettingsInput } from "@/lib/validation/settings";
import type { ProviderStatusMap, SettingsResponse } from "@/types/settings";

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
    const setting = await settingsRepository.findOrCreate();
    const providerStatus = getProviderStatus();

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
    return settingsRepository.upsert(input);
  },

  /**
   * 現在のAIプロバイダーを取得
   * @returns AIプロバイダー名
   */
  getCurrentProvider: async (): Promise<string> => {
    const setting = await settingsRepository.findOrCreate();
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
