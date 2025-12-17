/**
 * プロンプトRepository
 * データアクセス層 - Prismaを使用したプロンプトのCRUD操作
 */
import { prisma } from "@/lib/prisma";
import type { Prompt } from "@prisma/client";
import type { CreatePromptInput, UpdatePromptInput } from "@/lib/validation/prompt";

/**
 * プロンプトの並び順定義
 */
const DEFAULT_ORDER_BY = [
  { isDefault: "desc" as const },
  { updatedAt: "desc" as const },
];

/**
 * プロンプトRepository
 */
export const promptRepository = {
  /**
   * プロンプト一覧を取得
   * @returns プロンプト一覧（デフォルト優先、更新日時降順）
   */
  findAll: async (): Promise<Prompt[]> => {
    return prisma.prompt.findMany({
      orderBy: DEFAULT_ORDER_BY,
    });
  },

  /**
   * IDでプロンプトを取得
   * @param id プロンプトID
   * @returns プロンプト、存在しない場合はnull
   */
  findById: async (id: string): Promise<Prompt | null> => {
    return prisma.prompt.findUnique({
      where: { id },
    });
  },

  /**
   * デフォルトプロンプトを取得
   * @returns デフォルトプロンプト、存在しない場合はnull
   */
  findDefault: async (): Promise<Prompt | null> => {
    return prisma.prompt.findFirst({
      where: { isDefault: true },
    });
  },

  /**
   * プロンプトを作成
   * @param data 作成データ
   * @returns 作成されたプロンプト
   */
  create: async (data: CreatePromptInput): Promise<Prompt> => {
    return prisma.prompt.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        content: data.content,
        isDefault: false,
      },
    });
  },

  /**
   * プロンプトを更新
   * @param id プロンプトID
   * @param data 更新データ
   * @returns 更新されたプロンプト
   */
  update: async (id: string, data: UpdatePromptInput): Promise<Prompt> => {
    return prisma.prompt.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.content !== undefined && { content: data.content }),
      },
    });
  },

  /**
   * プロンプトを削除
   * @param id プロンプトID
   */
  delete: async (id: string): Promise<void> => {
    await prisma.prompt.delete({
      where: { id },
    });
  },

  /**
   * デフォルトプロンプトを設定（トランザクション）
   * 既存のデフォルトを解除し、指定されたプロンプトをデフォルトに設定
   * @param id プロンプトID
   * @returns 更新されたプロンプト
   */
  setDefault: async (id: string): Promise<Prompt> => {
    return prisma.$transaction(async (tx) => {
      // 既存のデフォルトを解除
      await tx.prompt.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      // 新しいデフォルトを設定
      return tx.prompt.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  },
};
