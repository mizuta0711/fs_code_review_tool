import type { AIProvider, LanguageModelClient } from "./types";
import { GeminiClient } from "./gemini";
import { AzureOpenAIClient } from "./azure-openai";

export function createAIClient(provider: AIProvider): LanguageModelClient {
  switch (provider) {
    case "gemini":
      return new GeminiClient();
    case "azure-openai":
      return new AzureOpenAIClient();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

// 利用可能なプロバイダーをチェック
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
  ];
}
