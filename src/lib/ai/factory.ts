import type { AIProvider, LanguageModelClient, AIClientConfig } from "./types";
import { GeminiClient } from "./gemini";
import { AzureOpenAIClient } from "./azure-openai";
import { ClaudeClient } from "./claude";

/**
 * AIクライアントを作成
 * @param provider プロバイダー種別
 * @param config オプションの設定（APIキー等）
 * @returns AIクライアント
 */
export function createAIClient(
  provider: AIProvider,
  config?: AIClientConfig
): LanguageModelClient {
  switch (provider) {
    case "gemini":
      return new GeminiClient(config);
    case "azure-openai":
      return new AzureOpenAIClient(config);
    case "claude":
      return new ClaudeClient(config);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

// 利用可能なプロバイダーをチェック（環境変数ベース）
export function getAvailableProviders(): {
  provider: AIProvider;
  available: boolean;
  reason?: string;
}[] {
  return [
    {
      provider: "gemini",
      available: !!process.env.GEMINI_API_KEY,
      reason: process.env.GEMINI_API_KEY ? undefined : "GEMINI_API_KEY is not set",
    },
    {
      provider: "azure-openai",
      available: !!(
        process.env.AZURE_OPENAI_ENDPOINT &&
        process.env.AZURE_OPENAI_API_KEY &&
        process.env.AZURE_OPENAI_DEPLOYMENT
      ),
      reason:
        process.env.AZURE_OPENAI_ENDPOINT &&
        process.env.AZURE_OPENAI_API_KEY &&
        process.env.AZURE_OPENAI_DEPLOYMENT
          ? undefined
          : "Azure OpenAI configuration is incomplete",
    },
    {
      provider: "claude",
      available: !!process.env.ANTHROPIC_API_KEY,
      reason: process.env.ANTHROPIC_API_KEY ? undefined : "ANTHROPIC_API_KEY is not set",
    },
  ];
}
