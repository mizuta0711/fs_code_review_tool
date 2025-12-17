/**
 * AIプロバイダーService
 * ビジネスロジック層 - AIプロバイダー管理のビジネスルールを実装
 */
import { aiProviderRepository } from "../repositories/aiProviderRepository.server";
import { NotFoundError, BusinessError } from "@/lib/api-helpers";
import { ERROR_MESSAGES, ERROR_CODES } from "@/lib/constants";
import { logger, createTimer } from "@/lib/logger";
import { decrypt, verifyPassword } from "@/lib/crypto";
import type { AIProviderConfig } from "@prisma/client";
import type { CreateAIProviderInput, UpdateAIProviderInput } from "@/lib/validation/ai-provider";
import type { AIProviderListItem } from "@/types/settings";

const SERVICE_NAME = "aiProviderService";

/**
 * プロバイダー設定をAPIレスポンス用に変換（機密情報を除去）
 */
function toListItem(config: AIProviderConfig): AIProviderListItem {
  return {
    id: config.id,
    name: config.name,
    provider: config.provider as AIProviderListItem["provider"],
    endpoint: config.endpoint,
    deployment: config.deployment,
    model: config.model,
    isActive: config.isActive,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

/**
 * AIプロバイダーService
 */
export const aiProviderService = {
  /**
   * プロバイダー設定一覧を取得（機密情報を除去）
   * @returns プロバイダー設定一覧
   */
  getAll: async (): Promise<AIProviderListItem[]> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "getAll");

    const configs = await aiProviderRepository.findAll();

    logger.serviceEnd(SERVICE_NAME, "getAll", timer.elapsed(), {
      count: configs.length,
    });
    return configs.map(toListItem);
  },

  /**
   * プロバイダー設定を取得
   * @param id プロバイダーID
   * @returns プロバイダー設定
   * @throws NotFoundError プロバイダー設定が存在しない場合
   */
  getById: async (id: string): Promise<AIProviderListItem> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "getById", { resourceId: id });

    const config = await aiProviderRepository.findById(id);
    if (!config) {
      logger.warn(`${SERVICE_NAME}.getById: not found`, { resourceId: id });
      throw new NotFoundError(
        ERROR_MESSAGES.AI_PROVIDER.NOT_FOUND,
        ERROR_CODES.AI_PROVIDER_NOT_FOUND
      );
    }

    logger.serviceEnd(SERVICE_NAME, "getById", timer.elapsed(), {
      resourceId: id,
    });
    return toListItem(config);
  },

  /**
   * アクティブなプロバイダー設定を取得
   * @returns アクティブなプロバイダー設定、存在しない場合はnull
   */
  getActive: async (): Promise<AIProviderListItem | null> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "getActive");

    const config = await aiProviderRepository.findActive();

    logger.serviceEnd(SERVICE_NAME, "getActive", timer.elapsed(), {
      found: !!config,
    });
    return config ? toListItem(config) : null;
  },

  /**
   * プロバイダー設定を作成
   * @param input 作成データ
   * @returns 作成されたプロバイダー設定
   */
  create: async (input: CreateAIProviderInput): Promise<AIProviderListItem> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "create", { name: input.name, provider: input.provider });

    const config = await aiProviderRepository.create(input);

    logger.serviceEnd(SERVICE_NAME, "create", timer.elapsed(), {
      resourceId: config.id,
    });
    logger.info("AI provider created", { resourceId: config.id, name: config.name });
    return toListItem(config);
  },

  /**
   * プロバイダー設定を更新
   * @param id プロバイダーID
   * @param input 更新データ
   * @returns 更新されたプロバイダー設定
   * @throws NotFoundError プロバイダー設定が存在しない場合
   */
  update: async (id: string, input: UpdateAIProviderInput): Promise<AIProviderListItem> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "update", { resourceId: id });

    // 存在確認
    const existing = await aiProviderRepository.findById(id);
    if (!existing) {
      logger.warn(`${SERVICE_NAME}.update: not found`, { resourceId: id });
      throw new NotFoundError(
        ERROR_MESSAGES.AI_PROVIDER.NOT_FOUND,
        ERROR_CODES.AI_PROVIDER_NOT_FOUND
      );
    }

    const config = await aiProviderRepository.update(id, input);

    logger.serviceEnd(SERVICE_NAME, "update", timer.elapsed(), {
      resourceId: id,
    });
    logger.info("AI provider updated", { resourceId: id });
    return toListItem(config);
  },

  /**
   * プロバイダー設定を削除
   * @param id プロバイダーID
   * @throws NotFoundError プロバイダー設定が存在しない場合
   * @throws BusinessError アクティブなプロバイダーを削除しようとした場合
   */
  delete: async (id: string): Promise<void> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "delete", { resourceId: id });

    // 存在確認
    const existing = await aiProviderRepository.findById(id);
    if (!existing) {
      logger.warn(`${SERVICE_NAME}.delete: not found`, { resourceId: id });
      throw new NotFoundError(
        ERROR_MESSAGES.AI_PROVIDER.NOT_FOUND,
        ERROR_CODES.AI_PROVIDER_NOT_FOUND
      );
    }

    // アクティブなプロバイダーは削除不可
    if (existing.isActive) {
      logger.warn(`${SERVICE_NAME}.delete: cannot delete active`, {
        resourceId: id,
      });
      throw new BusinessError(
        ERROR_MESSAGES.AI_PROVIDER.CANNOT_DELETE_ACTIVE,
        ERROR_CODES.AI_PROVIDER_DELETE_FAILED
      );
    }

    await aiProviderRepository.delete(id);

    logger.serviceEnd(SERVICE_NAME, "delete", timer.elapsed(), {
      resourceId: id,
    });
    logger.info("AI provider deleted", { resourceId: id });
  },

  /**
   * プロバイダーをアクティブ化
   * @param id プロバイダーID
   * @returns アクティブ化されたプロバイダー設定
   * @throws NotFoundError プロバイダー設定が存在しない場合
   */
  setActive: async (id: string): Promise<AIProviderListItem> => {
    const timer = createTimer();
    logger.serviceStart(SERVICE_NAME, "setActive", { resourceId: id });

    // 存在確認
    const existing = await aiProviderRepository.findById(id);
    if (!existing) {
      logger.warn(`${SERVICE_NAME}.setActive: not found`, { resourceId: id });
      throw new NotFoundError(
        ERROR_MESSAGES.AI_PROVIDER.NOT_FOUND,
        ERROR_CODES.AI_PROVIDER_NOT_FOUND
      );
    }

    const config = await aiProviderRepository.setActive(id);

    logger.serviceEnd(SERVICE_NAME, "setActive", timer.elapsed(), {
      resourceId: id,
    });
    logger.info("AI provider activated", { resourceId: id });
    return toListItem(config);
  },

  /**
   * パスワードを検証
   * @param id プロバイダーID
   * @param password パスワード
   * @returns 検証結果
   */
  verifyPassword: async (id: string, password: string): Promise<boolean> => {
    const config = await aiProviderRepository.findById(id);
    if (!config) {
      return false;
    }
    return verifyPassword(password, config.password);
  },

  /**
   * 復号されたAPIキーを取得（レビュー実行時に使用）
   * @param id プロバイダーID
   * @returns 復号されたAPIキー
   * @throws NotFoundError プロバイダー設定が存在しない場合
   */
  getDecryptedApiKey: async (id: string): Promise<string> => {
    const config = await aiProviderRepository.findById(id);
    if (!config) {
      throw new NotFoundError(
        ERROR_MESSAGES.AI_PROVIDER.NOT_FOUND,
        ERROR_CODES.AI_PROVIDER_NOT_FOUND
      );
    }
    return decrypt(config.apiKey);
  },

  /**
   * プロバイダー設定の全情報を取得（内部使用）
   * @param id プロバイダーID
   * @returns プロバイダー設定（APIキー含む）
   */
  getFullConfig: async (id: string): Promise<AIProviderConfig | null> => {
    return aiProviderRepository.findById(id);
  },

  /**
   * アクティブなプロバイダーの全情報を取得（内部使用）
   * @returns アクティブなプロバイダー設定（APIキー含む）
   */
  getActiveFullConfig: async (): Promise<AIProviderConfig | null> => {
    return aiProviderRepository.findActive();
  },
};
