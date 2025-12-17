/**
 * Claude (Anthropic) AIクライアント
 */
import Anthropic from "@anthropic-ai/sdk";
import type {
  LanguageModelClient,
  ReviewRequest,
  ReviewResponse,
  AIClientConfig,
} from "./types";

export class ClaudeClient implements LanguageModelClient {
  private client: Anthropic;
  private model: string;

  constructor(config?: AIClientConfig) {
    const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Anthropic API key is not configured");
    }
    this.client = new Anthropic({ apiKey });
    this.model = config?.model || process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";
    console.log(`[ClaudeClient] Initialized with model: ${this.model}`);
  }

  async review(request: ReviewRequest): Promise<ReviewResponse> {
    const reviewedFiles = await Promise.all(
      request.files.map(async (file) => {
        const prompt = this.buildPrompt(
          request.prompt,
          file.name,
          file.language,
          file.content
        );

        try {
          console.log(`[ClaudeClient] Sending request for file: ${file.name}, model: ${this.model}`);
          const message = await this.client.messages.create({
            model: this.model,
            max_tokens: 8192,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const content = message.content[0];
          const reviewedContent = content.type === "text" ? content.text : "";

          return {
            name: file.name,
            language: file.language,
            content: this.extractCode(reviewedContent),
          };
        } catch (error) {
          console.error(`[ClaudeClient] Error reviewing ${file.name}:`, error);
          throw error;
        }
      })
    );

    return { reviewedFiles };
  }

  private buildPrompt(
    systemPrompt: string,
    fileName: string,
    language: string,
    code: string
  ): string {
    return `${systemPrompt}

---

ファイル名: ${fileName}
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
