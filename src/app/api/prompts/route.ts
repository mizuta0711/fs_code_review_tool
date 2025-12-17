import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/prompts - プロンプト一覧取得
export async function GET() {
  try {
    const prompts = await prisma.prompt.findMany({
      orderBy: [
        { isDefault: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error("Failed to fetch prompts:", error);
    return NextResponse.json(
      { error: "プロンプトの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/prompts - プロンプト作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, content } = body;

    // バリデーション
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "プロンプト名は必須です" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "プロンプト内容は必須です" },
        { status: 400 }
      );
    }

    const prompt = await prisma.prompt.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        content: content.trim(),
        isDefault: false,
      },
    });

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error("Failed to create prompt:", error);
    return NextResponse.json(
      { error: "プロンプトの作成に失敗しました" },
      { status: 500 }
    );
  }
}
