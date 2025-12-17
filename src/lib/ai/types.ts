// コードファイル
export interface CodeFile {
  name: string;
  language: string;
  content: string;
}

// レビューリクエスト
export interface ReviewRequest {
  files: CodeFile[];
  prompt: string;
}

// レビュー済みファイル
export interface ReviewedFile {
  name: string;
  language: string;
  content: string;
}

// レビューレスポンス
export interface ReviewResponse {
  reviewedFiles: ReviewedFile[];
}

// AIクライアントインターフェース
export interface LanguageModelClient {
  review(request: ReviewRequest): Promise<ReviewResponse>;
}

// AIプロバイダー種別
export type AIProvider = "gemini" | "azure-openai";
