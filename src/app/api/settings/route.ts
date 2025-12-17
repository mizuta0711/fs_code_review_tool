import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 有効なAIプロバイダー
const VALID_PROVIDERS = ["gemini", "azure-openai"] as const;
type AIProvider = (typeof VALID_PROVIDERS)[number];

// GET /api/settings - 設定取得
export async function GET() {
  try {
    // 設定を取得（存在しない場合は作成）
    let setting = await prisma.setting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          id: "default",
          aiProvider: "gemini",
        },
      });
    }

    // 環境変数からAPI設定状況をチェック
    const providerStatus = {
      gemini: {
        configured: !!process.env.GEMINI_API_KEY,
      },
      "azure-openai": {
        configured: !!(
          process.env.AZURE_OPENAI_ENDPOINT &&
          process.env.AZURE_OPENAI_API_KEY &&
          process.env.AZURE_OPENAI_DEPLOYMENT
        ),
      },
    };

    return NextResponse.json({
      ...setting,
      providerStatus,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "設定の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - 設定更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { aiProvider } = body;

    // バリデーション
    if (aiProvider && !VALID_PROVIDERS.includes(aiProvider as AIProvider)) {
      return NextResponse.json(
        { error: `無効なAIプロバイダーです。有効な値: ${VALID_PROVIDERS.join(", ")}` },
        { status: 400 }
      );
    }

    const setting = await prisma.setting.upsert({
      where: { id: "default" },
      update: {
        ...(aiProvider && { aiProvider }),
      },
      create: {
        id: "default",
        aiProvider: aiProvider || "gemini",
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "設定の更新に失敗しました" },
      { status: 500 }
    );
  }
}
