import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PUT /api/prompts/[id]/default - デフォルトプロンプト設定
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // 存在確認
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!existingPrompt) {
      return NextResponse.json(
        { error: "プロンプトが見つかりません" },
        { status: 404 }
      );
    }

    // トランザクションで整合性を確保
    const prompt = await prisma.$transaction(async (tx) => {
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

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("Failed to set default prompt:", error);
    return NextResponse.json(
      { error: "デフォルトプロンプトの設定に失敗しました" },
      { status: 500 }
    );
  }
}
