import { AzureOpenAI } from "openai";
import type {
  LanguageModelClient,
  ReviewRequest,
  ReviewResponse,
  AIClientConfig,
} from "./types";

export class AzureOpenAIClient implements LanguageModelClient {
  private client: AzureOpenAI;
  private deployment: string;

  constructor(config?: AIClientConfig) {
    const endpoint = config?.endpoint || process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = config?.apiKey || process.env.AZURE_OPENAI_API_KEY;
    const deployment = config?.deployment || process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-10-21";

    if (!endpoint || !apiKey || !deployment) {
      throw new Error(
        "Azure OpenAI configuration is incomplete. Required: endpoint, apiKey, deployment"
      );
    }

    this.client = new AzureOpenAI({
      endpoint,
      apiKey,
      apiVersion,
      deployment,
    });
    this.deployment = deployment;
  }

  async review(request: ReviewRequest): Promise<ReviewResponse> {
    const reviewedFiles = await Promise.all(
      request.files.map(async (file) => {
        const userMessage = this.buildUserMessage(file.name, file.language, file.content);

        const response = await this.client.chat.completions.create({
          model: this.deployment,
          messages: [
            { role: "system", content: request.prompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.3,
          max_tokens: 4096,
        });

        const reviewedContent = response.choices[0]?.message?.content || "";

        return {
          name: file.name,
          language: file.language,
          content: this.extractCode(reviewedContent),
        };
      })
    );

    return { reviewedFiles };
  }

  private buildUserMessage(fileName: string, language: string, code: string): string {
    return `ファイル名: ${fileName}
言語: ${language}

\`\`\`${language}
${code}
\`\`\``;
  }

  private extractCode(response: string): string {
    // コードブロックを抽出（```で囲まれた部分）
    const codeBlockMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }

    // コードブロックがない場合はそのまま返す
    return response.trim();
  }
}
