/**
 * プロンプトService
 * ビジネスロジック層 - プロンプト管理のビジネスルールを実装
 */
import { promptRepository } from "../repositories/promptRepository.server";
import { NotFoundError, BusinessError } from "@/lib/api-helpers";
import { ERROR_MESSAGES, ERROR_CODES } from "@/lib/constants";
import { logger, createTimer } from "@/lib/logger";
import type { Prompt } from "@prisma/client";
import type { CreatePromptInput, UpdatePromptInput } from "@/lib/validation/prompt";

const SERVICE_NAME = "promptService";

/**
 * プロンプトService
 */
export const promptService = {
  /**
   * プロンプト一覧を取得
   * @returns プロンプト一覧
   */
  getAll: async (): Promise<Prompt[]> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "getAll");

    const prompts = await promptRepository.findAll();

    logger.serviceEnd(SERVICE_NAME, "getAll", timer.elapsed(), {
      count: prompts.length,
    });
    return prompts;
  },

  /**
   * プロンプトを取得
   * @param id プロンプトID
   * @returns プロンプト
   * @throws NotFoundError プロンプトが存在しない場合
   */
  getById: async (id: string): Promise<Prompt> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "getById", { resourceId: id });

    const prompt = await promptRepository.findById(id);
    if (!prompt) {
      logger.warn(`${SERVICE_NAME}.getById: not found`, { resourceId: id });
      throw new NotFoundError(
        ERROR_MESSAGES.PROMPT.NOT_FOUND,
        ERROR_CODES.PROMPT_NOT_FOUND
      );
    }

    logger.serviceEnd(SERVICE_NAME, "getById", timer.elapsed(), {
      resourceId: id,
    });
    return prompt;
  },

  /**
   * デフォルトプロンプトを取得
   * @returns デフォルトプロンプト、存在しない場合はnull
   */
  getDefault: async (): Promise<Prompt | null> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "getDefault");

    const prompt = await promptRepository.findDefault();

    logger.serviceEnd(SERVICE_NAME, "getDefault", timer.elapsed(), {
      found: !!prompt,
    });
    return prompt;
  },

  /**
   * プロンプトを作成
   * @param input 作成データ
   * @returns 作成されたプロンプト
   */
  create: async (input: CreatePromptInput): Promise<Prompt> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "create", { name: input.name });

    const prompt = await promptRepository.create(input);

    logger.serviceEnd(SERVICE_NAME, "create", timer.elapsed(), {
      resourceId: prompt.id,
    });
    logger.info("Prompt created", { resourceId: prompt.id, name: prompt.name });
    return prompt;
  },

  /**
   * プロンプトを更新
   * @param id プロンプトID
   * @param input 更新データ
   * @returns 更新されたプロンプト
   * @throws NotFoundError プロンプトが存在しない場合
   */
  update: async (id: string, input: UpdatePromptInput): Promise<Prompt> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "update", { resourceId: id });

    // 存在確認
    const existing = await promptRepository.findById(id);
    if (!existing) {
      logger.warn(`${SERVICE_NAME}.update: not found`, { resourceId: id });
      throw new NotFoundError(
        ERROR_MESSAGES.PROMPT.NOT_FOUND,
        ERROR_CODES.PROMPT_NOT_FOUND
      );
    }

    const prompt = await promptRepository.update(id, input);

    logger.serviceEnd(SERVICE_NAME, "update", timer.elapsed(), {
      resourceId: id,
    });
    logger.info("Prompt updated", { resourceId: id });
    return prompt;
  },

  /**
   * プロンプトを削除
   * @param id プロンプトID
   * @throws NotFoundError プロンプトが存在しない場合
   * @throws BusinessError デフォルトプロンプトを削除しようとした場合
   */
  delete: async (id: string): Promise<void> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "delete", { resourceId: id });

    // 存在確認
    const existing = await promptRepository.findById(id);
    if (!existing) {
      logger.warn(`${SERVICE_NAME}.delete: not found`, { resourceId: id });
      throw new NotFoundError(
        ERROR_MESSAGES.PROMPT.NOT_FOUND,
        ERROR_CODES.PROMPT_NOT_FOUND
      );
    }

    // デフォルトプロンプトは削除不可
    if (existing.isDefault) {
      logger.warn(`${SERVICE_NAME}.delete: cannot delete default`, {
        resourceId: id,
      });
      throw new BusinessError(
        ERROR_MESSAGES.PROMPT.CANNOT_DELETE_DEFAULT,
        ERROR_CODES.PROMPT_CANNOT_DELETE_DEFAULT
      );
    }

    await promptRepository.delete(id);

    logger.serviceEnd(SERVICE_NAME, "delete", timer.elapsed(), {
      resourceId: id,
    });
    logger.info("Prompt deleted", { resourceId: id });
  },

  /**
   * デフォルトプロンプトを設定
   * @param id プロンプトID
   * @returns 更新されたプロンプト
   * @throws NotFoundError プロンプトが存在しない場合
   */
  setDefault: async (id: string): Promise<Prompt> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "setDefault", { resourceId: id });

    // 存在確認
    const existing = await promptRepository.findById(id);
    if (!existing) {
      logger.warn(`${SERVICE_NAME}.setDefault: not found`, { resourceId: id });
      throw new NotFoundError(
        ERROR_MESSAGES.PROMPT.NOT_FOUND,
        ERROR_CODES.PROMPT_NOT_FOUND
      );
    }

    const prompt = await promptRepository.setDefault(id);

    logger.serviceEnd(SERVICE_NAME, "setDefault", timer.elapsed(), {
      resourceId: id,
    });
    logger.info("Default prompt set", { resourceId: id });
    return prompt;
  },
};
