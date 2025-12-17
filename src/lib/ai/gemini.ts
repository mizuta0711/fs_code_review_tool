import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LanguageModelClient, ReviewRequest, ReviewResponse } from "./types";

export class GeminiClient implements LanguageModelClient {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  async review(request: ReviewRequest): Promise<ReviewResponse> {
    const model = this.client.getGenerativeModel({ model: this.model });

    const reviewedFiles = await Promise.all(
      request.files.map(async (file) => {
        const prompt = this.buildPrompt(request.prompt, file.name, file.language, file.content);

        const result = await model.generateContent(prompt);
        const response = result.response;
        const reviewedContent = response.text();

        return {
          name: file.name,
          language: file.language,
          content: this.extractCode(reviewedContent),
        };
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
