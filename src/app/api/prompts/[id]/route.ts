import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

// GET /api/prompts/[id] - プロンプト詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const prompt = await prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "プロンプトが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("Failed to fetch prompt:", error);
    return NextResponse.json(
      { error: "プロンプトの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/prompts/[id] - プロンプト更新
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, content } = body;

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

    // バリデーション
    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "プロンプト名は空にできません" },
        { status: 400 }
      );
    }

    if (content !== undefined && (typeof content !== "string" || content.trim().length === 0)) {
      return NextResponse.json(
        { error: "プロンプト内容は空にできません" },
        { status: 400 }
      );
    }

    const prompt = await prisma.prompt.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(content !== undefined && { content: content.trim() }),
      },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("Failed to update prompt:", error);
    return NextResponse.json(
      { error: "プロンプトの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/prompts/[id] - プロンプト削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // デフォルトプロンプトは削除不可
    if (existingPrompt.isDefault) {
      return NextResponse.json(
        { error: "デフォルトプロンプトは削除できません" },
        { status: 400 }
      );
    }

    await prisma.prompt.delete({
      where: { id },
    });

    return NextResponse.json({ message: "プロンプトを削除しました" });
  } catch (error) {
    console.error("Failed to delete prompt:", error);
    return NextResponse.json(
      { error: "プロンプトの削除に失敗しました" },
      { status: 500 }
    );
  }
}
