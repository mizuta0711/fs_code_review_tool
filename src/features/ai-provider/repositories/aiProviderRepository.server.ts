/**
 * AIプロバイダーRepository
 * データアクセス層 - Prismaを使用したAIプロバイダー設定のCRUD操作
 */
import { prisma } from "@/lib/prisma";
import type { AIProviderConfig } from "@prisma/client";
import type { CreateAIProviderInput, UpdateAIProviderInput } from "@/lib/validation/ai-provider";
import { encrypt, hashPassword } from "@/lib/crypto";

/**
 * AIプロバイダーRepository
 */
export const aiProviderRepository = {
  /**
   * 全プロバイダー設定を取得
   * @returns プロバイダー設定一覧
   */
  findAll: async (): Promise<AIProviderConfig[]> => {
    return prisma.aIProviderConfig.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });
  },

  /**
   * IDでプロバイダー設定を取得
   * @param id プロバイダーID
   * @returns プロバイダー設定、存在しない場合はnull
   */
  findById: async (id: string): Promise<AIProviderConfig | null> => {
    return prisma.aIProviderConfig.findUnique({
      where: { id },
    });
  },

  /**
   * アクティブなプロバイダー設定を取得
   * @returns アクティブなプロバイダー設定、存在しない場合はnull
   */
  findActive: async (): Promise<AIProviderConfig | null> => {
    return prisma.aIProviderConfig.findFirst({
      where: { isActive: true },
    });
  },

  /**
   * プロバイダー設定を作成
   * @param data 作成データ
   * @returns 作成されたプロバイダー設定
   */
  create: async (data: CreateAIProviderInput): Promise<AIProviderConfig> => {
    return prisma.aIProviderConfig.create({
      data: {
        name: data.name,
        provider: data.provider,
        apiKey: encrypt(data.apiKey),
        endpoint: data.endpoint || null,
        deployment: data.deployment || null,
        model: data.model || null,
        password: data.password ? hashPassword(data.password) : null,
        isActive: false,
      },
    });
  },

  /**
   * プロバイダー設定を更新
   * @param id プロバイダーID
   * @param data 更新データ
   * @returns 更新されたプロバイダー設定
   */
  update: async (id: string, data: UpdateAIProviderInput): Promise<AIProviderConfig> => {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.apiKey !== undefined) updateData.apiKey = encrypt(data.apiKey);
    if (data.endpoint !== undefined) updateData.endpoint = data.endpoint || null;
    if (data.deployment !== undefined) updateData.deployment = data.deployment || null;
    if (data.model !== undefined) updateData.model = data.model || null;
    if (data.password !== undefined) {
      updateData.password = data.password ? hashPassword(data.password) : null;
    }

    return prisma.aIProviderConfig.update({
      where: { id },
      data: updateData,
    });
  },

  /**
   * プロバイダー設定を削除
   * @param id プロバイダーID
   */
  delete: async (id: string): Promise<void> => {
    await prisma.aIProviderConfig.delete({
      where: { id },
    });
  },

  /**
   * プロバイダーをアクティブ化（他は非アクティブに）
   * @param id アクティブにするプロバイダーID
   * @returns アクティブ化されたプロバイダー設定
   */
  setActive: async (id: string): Promise<AIProviderConfig> => {
    return prisma.$transaction(async (tx) => {
      // 全てのプロバイダーを非アクティブに
      await tx.aIProviderConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // 指定されたプロバイダーをアクティブに
      return tx.aIProviderConfig.update({
        where: { id },
        data: { isActive: true },
      });
    });
  },

  /**
   * 全プロバイダーを非アクティブ化
   */
  deactivateAll: async (): Promise<void> => {
    await prisma.aIProviderConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  },
};
