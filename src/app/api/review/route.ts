import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAIClient, type AIProvider, type CodeFile } from "@/lib/ai";

interface ReviewRequestBody {
  files: CodeFile[];
  promptId?: string;
}

// POST /api/review - レビュー実行
export async function POST(request: NextRequest) {
  try {
    const body: ReviewRequestBody = await request.json();
    const { files, promptId } = body;

    // バリデーション: ファイル
    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "レビュー対象のファイルが必要です" },
        { status: 400 }
      );
    }

    // ファイル内容のバリデーション
    for (const file of files) {
      if (!file.name || !file.content) {
        return NextResponse.json(
          { error: "ファイル名とコンテンツは必須です" },
          { status: 400 }
        );
      }
    }

    // プロンプト取得
    let prompt;
    if (promptId) {
      prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
      });
      if (!prompt) {
        return NextResponse.json(
          { error: "指定されたプロンプトが見つかりません" },
          { status: 404 }
        );
      }
    } else {
      // デフォルトプロンプトを取得
      prompt = await prisma.prompt.findFirst({
        where: { isDefault: true },
      });
      if (!prompt) {
        return NextResponse.json(
          { error: "デフォルトプロンプトが設定されていません" },
          { status: 500 }
        );
      }
    }

    // 設定取得
    const setting = await prisma.setting.findUnique({
      where: { id: "default" },
    });
    const aiProvider: AIProvider = (setting?.aiProvider as AIProvider) || "gemini";

    // AIクライアント作成
    let client;
    try {
      client = createAIClient(aiProvider);
    } catch (error) {
      console.error("Failed to create AI client:", error);
      return NextResponse.json(
        { error: `AIクライアントの初期化に失敗しました: ${aiProvider}の設定を確認してください` },
        { status: 500 }
      );
    }

    // レビュー実行
    const result = await client.review({
      files,
      prompt: prompt.content,
    });

    return NextResponse.json({
      reviewedFiles: result.reviewedFiles,
      provider: aiProvider,
      promptId: prompt.id,
      promptName: prompt.name,
    });
  } catch (error) {
    console.error("Review failed:", error);

    // タイムアウトエラーの場合
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        { error: "レビューがタイムアウトしました。コードを小分けにして再試行してください" },
        { status: 504 }
      );
    }

    // レート制限エラーの場合
    if (error instanceof Error && (error.message.includes("rate") || error.message.includes("quota"))) {
      return NextResponse.json(
        { error: "API利用制限に達しました。しばらく待ってから再試行してください" },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "レビューの実行に失敗しました" },
      { status: 500 }
    );
  }
}
