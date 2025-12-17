/**
 * 設定関連の型定義
 */

import type { AIProviderType } from "@/lib/constants";

/**
 * 設定エンティティ
 */
export interface Settings {
  id: string;
  activeProviderId: string | null;
  updatedAt: Date;
}

/**
 * 設定更新入力
 */
export interface UpdateSettingsInput {
  activeProviderId?: string | null;
}

/**
 * AIプロバイダー設定エンティティ
 */
export interface AIProviderConfig {
  id: string;
  name: string;
  provider: AIProviderType;
  apiKey?: string; // レスポンス時はマスク or 省略
  endpoint?: string | null;
  deployment?: string | null;
  model?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AIプロバイダー作成入力
 */
export interface CreateAIProviderInput {
  name: string;
  provider: AIProviderType;
  apiKey: string;
  endpoint?: string;
  deployment?: string;
  model?: string;
  password: string;
}

/**
 * AIプロバイダー更新入力
 */
export interface UpdateAIProviderInput {
  name?: string;
  provider?: AIProviderType;
  apiKey?: string;
  endpoint?: string | null;
  deployment?: string | null;
  model?: string | null;
  password?: string;
}

/**
 * AIプロバイダー一覧レスポンス（APIキー・パスワードは含まない）
 */
export interface AIProviderListItem {
  id: string;
  name: string;
  provider: AIProviderType;
  endpoint?: string | null;
  deployment?: string | null;
  model?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  claude: ProviderStatus;
}

/**
 * 設定取得レスポンス
 */
export interface SettingsResponse extends Settings {
  providerStatus: ProviderStatusMap;
  activeProvider: AIProviderListItem | null;
}
