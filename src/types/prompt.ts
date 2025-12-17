/**
 * プロンプト関連の型定義
 */

/**
 * プロンプトエンティティ
 */
export interface Prompt {
  id: string;
  name: string;
  description: string | null;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * プロンプト作成入力
 */
export interface CreatePromptInput {
  name: string;
  description?: string | null;
  content: string;
}

/**
 * プロンプト更新入力
 */
export interface UpdatePromptInput {
  name?: string;
  description?: string | null;
  content?: string;
}

/**
 * プロンプト一覧レスポンス
 */
export type PromptsListResponse = Prompt[];

/**
 * プロンプト詳細レスポンス
 */
export type PromptDetailResponse = Prompt;

/**
 * プロンプト作成レスポンス
 */
export type PromptCreateResponse = Prompt;

/**
 * プロンプト更新レスポンス
 */
export type PromptUpdateResponse = Prompt;
