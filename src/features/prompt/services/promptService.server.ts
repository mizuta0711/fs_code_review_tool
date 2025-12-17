/**
 * プロンプトService
 * ビジネスロジック層 - プロンプト管理のビジネスルールを実装
 */
import { promptRepository } from "../repositories/promptRepository.server";
import { NotFoundError, BusinessError } from "@/lib/api-helpers";
import { ERROR_MESSAGES, ERROR_CODES } from "@/lib/constants";
import type { Prompt } from "@prisma/client";
import type { CreatePromptInput, UpdatePromptInput } from "@/lib/validation/prompt";

/**
 * プロンプトService
 */
export const promptService = {
  /**
   * プロンプト一覧を取得
   * @returns プロンプト一覧
   */
  getAll: async (): Promise<Prompt[]> => {
    return promptRepository.findAll();
  },

  /**
   * プロンプトを取得
   * @param id プロンプトID
   * @returns プロンプト
   * @throws NotFoundError プロンプトが存在しない場合
   */
  getById: async (id: string): Promise<Prompt> => {
    const prompt = await promptRepository.findById(id);
    if (!prompt) {
      throw new NotFoundError(
        ERROR_MESSAGES.PROMPT.NOT_FOUND,
        ERROR_CODES.PROMPT_NOT_FOUND
      );
    }
    return prompt;
  },

  /**
   * デフォルトプロンプトを取得
   * @returns デフォルトプロンプト、存在しない場合はnull
   */
  getDefault: async (): Promise<Prompt | null> => {
    return promptRepository.findDefault();
  },

  /**
   * プロンプトを作成
   * @param input 作成データ
   * @returns 作成されたプロンプト
   */
  create: async (input: CreatePromptInput): Promise<Prompt> => {
    return promptRepository.create(input);
  },

  /**
   * プロンプトを更新
   * @param id プロンプトID
   * @param input 更新データ
   * @returns 更新されたプロンプト
   * @throws NotFoundError プロンプトが存在しない場合
   */
  update: async (id: string, input: UpdatePromptInput): Promise<Prompt> => {
    // 存在確認
    const existing = await promptRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(
        ERROR_MESSAGES.PROMPT.NOT_FOUND,
        ERROR_CODES.PROMPT_NOT_FOUND
      );
    }

    return promptRepository.update(id, input);
  },

  /**
   * プロンプトを削除
   * @param id プロンプトID
   * @throws NotFoundError プロンプトが存在しない場合
   * @throws BusinessError デフォルトプロンプトを削除しようとした場合
   */
  delete: async (id: string): Promise<void> => {
    // 存在確認
    const existing = await promptRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(
        ERROR_MESSAGES.PROMPT.NOT_FOUND,
        ERROR_CODES.PROMPT_NOT_FOUND
      );
    }

    // デフォルトプロンプトは削除不可
    if (existing.isDefault) {
      throw new BusinessError(
        ERROR_MESSAGES.PROMPT.CANNOT_DELETE_DEFAULT,
        ERROR_CODES.PROMPT_CANNOT_DELETE_DEFAULT
      );
    }

    await promptRepository.delete(id);
  },

  /**
   * デフォルトプロンプトを設定
   * @param id プロンプトID
   * @returns 更新されたプロンプト
   * @throws NotFoundError プロンプトが存在しない場合
   */
  setDefault: async (id: string): Promise<Prompt> => {
    // 存在確認
    const existing = await promptRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(
        ERROR_MESSAGES.PROMPT.NOT_FOUND,
        ERROR_CODES.PROMPT_NOT_FOUND
      );
    }

    return promptRepository.setDefault(id);
  },
};
