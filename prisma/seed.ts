import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 中級編AIコードレビュープロンプトを読み込み
  const promptPath = path.join(__dirname, "../docs/中級編AIコードレビュープロンプト.txt");
  let promptContent = "";

  try {
    promptContent = fs.readFileSync(promptPath, "utf-8");
    console.log("Loaded prompt file successfully");
  } catch {
    // ファイルが見つからない場合はデフォルトの内容を使用
    promptContent = `【あなたへの指示】
あなたは日本のIT企業に勤める教育担当エンジニアです。
これから、プログラミングを学習中の初級者が作成したJavaソースコードに対してコードレビューを行ってください。

【レビュー目的】
- プログラムを書いた学習者が前向きになれるよう、優しい表現でコメントしてください。

【レビュー観点】
- [必須] 適切にインデントされているか
- [必須] 命名規則（クラス名、変数名、メソッド名、命名規則の統一）
- [必須] オブジェクト指向の思想に沿って記述されているか
- [意見] 適切にメソッド分割をしているか
- [必須] 可読性・保守性を意識した記述になっているか

【出力形式】
指摘事項のあるプログラムの行に対して行の上にコメントを追加してプログラムを出力してください。`;
    console.log("Using default prompt content");
  }

  // デフォルトプロンプト作成
  const defaultPrompt = await prisma.prompt.upsert({
    where: { id: "default-prompt" },
    update: {
      content: promptContent,
    },
    create: {
      id: "default-prompt",
      name: "中級編AIコードレビュープロンプト",
      description: "Java初級者向けの詳細なレビュー観点を含むプロンプト",
      content: promptContent,
      isDefault: true,
    },
  });
  console.log(`Created/Updated prompt: ${defaultPrompt.name}`);

  // 簡易レビュープロンプト作成
  const simplePrompt = await prisma.prompt.upsert({
    where: { id: "simple-prompt" },
    update: {},
    create: {
      id: "simple-prompt",
      name: "簡易レビュープロンプト",
      description: "シンプルなコードレビュー用プロンプト",
      content: `あなたはコードレビュアーです。
以下のコードをレビューしてください。

【レビュー観点】
- コーディング規約の遵守
- 可読性
- 基本的なバグの有無

【出力形式】
コード内にコメントとしてレビュー結果を記載してください。
- [必須] 必ず修正すべき問題
- [意見] 改善提案
- [参考] 補足情報`,
      isDefault: false,
    },
  });
  console.log(`Created/Updated prompt: ${simplePrompt.name}`);

  // 設定の初期化（activeProviderIdは後から設定される）
  const setting = await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      activeProviderId: null,
    },
  });
  console.log(`Created/Updated setting: activeProviderId=${setting.activeProviderId || "not set"}`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
