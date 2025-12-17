/**
 * 設定関連の型定義
 */

import type { AIProviderType } from "@/lib/constants";

/**
 * 設定エンティティ
 */
export interface Settings {
  id: string;
  aiProvider: AIProviderType;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 設定更新入力
 */
export interface UpdateSettingsInput {
  aiProvider?: AIProviderType;
}

/**
 * プロバイダー状態
 */
export interface ProviderStatus {
  configured: boolean;
}

/**
 * プロバイダー状態マップ
 */
export interface ProviderStatusMap {
  gemini: ProviderStatus;
  "azure-openai": ProviderStatus;
}

/**
 * 設定取得レスポンス
 */
export interface SettingsResponse extends Settings {
  providerStatus: ProviderStatusMap;
}
