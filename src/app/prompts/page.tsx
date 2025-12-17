"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  StarOff,
  FileText,
} from "lucide-react";

// モック用のプロンプトデータ
interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
}

const initialPrompts: Prompt[] = [
  {
    id: "1",
    name: "Java基本レビュー",
    description: "Javaコードの基本的なレビューを行います",
    content: `あなたはJavaのコードレビュアーです。
以下のコードをレビューしてください。

【レビュー観点】
- コーディング規約の遵守
- 可読性
- 基本的なバグの有無

【出力形式】
コード内にコメントとしてレビュー結果を記載してください。`,
    isDefault: true,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "中級Javaレビュー",
    description: "より詳細なJavaコードレビューを行います",
    content: `あなたは経験豊富なJavaエンジニアです。
以下のコードを詳細にレビューしてください。

【レビュー観点】
- 設計パターンの適切な使用
- SOLID原則の遵守
- パフォーマンス
- セキュリティ
- テスタビリティ

【出力形式】
コード内にコメントとしてレビュー結果を記載してください。`,
    isDefault: false,
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "TypeScriptレビュー",
    description: "TypeScriptコードのレビューを行います",
    content: `あなたはTypeScriptのエキスパートです。
以下のコードをレビューしてください。

【レビュー観点】
- 型安全性
- ベストプラクティス
- 可読性

【出力形式】
コード内にコメントとしてレビュー結果を記載してください。`,
    isDefault: false,
    createdAt: "2024-02-01",
  },
];

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
  });

  // ダイアログを開く（新規作成）
  const openNewDialog = () => {
    setEditingPrompt(null);
    setFormData({ name: "", description: "", content: "" });
    setIsDialogOpen(true);
  };

  // ダイアログを開く（編集）
  const openEditDialog = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      name: prompt.name,
      description: prompt.description,
      content: prompt.content,
    });
    setIsDialogOpen(true);
  };

  // 保存
  const handleSave = () => {
    if (editingPrompt) {
      // 編集
      setPrompts(
        prompts.map((p) =>
          p.id === editingPrompt.id
            ? { ...p, ...formData }
            : p
        )
      );
    } else {
      // 新規作成
      const newPrompt: Prompt = {
        id: String(Date.now()),
        ...formData,
        isDefault: false,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setPrompts([...prompts, newPrompt]);
    }
    setIsDialogOpen(false);
  };

  // 削除
  const handleDelete = (id: string) => {
    setPrompts(prompts.filter((p) => p.id !== id));
  };

  // デフォルト設定
  const toggleDefault = (id: string) => {
    setPrompts(
      prompts.map((p) => ({
        ...p,
        isDefault: p.id === id ? !p.isDefault : false,
      }))
    );
  };

  return (
    <div className="container space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">プロンプト管理</h1>
          <p className="text-muted-foreground">
            レビューに使用するプロンプトテンプレートを管理します
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPrompt ? "プロンプトを編集" : "新規プロンプト作成"}
              </DialogTitle>
              <DialogDescription>
                レビューに使用するプロンプトテンプレートを設定します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例: Java基本レビュー"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="例: Javaコードの基本的なレビューを行います"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">プロンプト内容</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="AIに送信するプロンプトを入力してください"
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={!formData.name || !formData.content}>
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* プロンプト一覧 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => (
          <Card key={prompt.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{prompt.name}</CardTitle>
                </div>
                {prompt.isDefault && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    デフォルト
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {prompt.description}
              </p>
              <div className="rounded-md bg-muted p-2">
                <pre className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                  {prompt.content}
                </pre>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  作成日: {prompt.createdAt}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleDefault(prompt.id)}
                    title={prompt.isDefault ? "デフォルトを解除" : "デフォルトに設定"}
                  >
                    {prompt.isDefault ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(prompt)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(prompt.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 空の状態 */}
      {prompts.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">プロンプトがありません</h3>
          <p className="text-muted-foreground mb-4">
            新規作成ボタンからプロンプトを追加してください
          </p>
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        </Card>
      )}
    </div>
  );
}
