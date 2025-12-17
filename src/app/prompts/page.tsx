"use client";

import { useState, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { promptsApi, type Prompt, ApiError } from "@/lib/api-client";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
  });

  // プロンプト一覧を取得
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const data = await promptsApi.list();
        setPrompts(data);
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
        toast.error("プロンプトの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrompts();
  }, []);

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
      description: prompt.description || "",
      content: prompt.content,
    });
    setIsDialogOpen(true);
  };

  // 保存
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (editingPrompt) {
        // 編集
        const updated = await promptsApi.update(editingPrompt.id, {
          name: formData.name,
          description: formData.description || undefined,
          content: formData.content,
        });
        setPrompts(prompts.map((p) => (p.id === updated.id ? updated : p)));
        toast.success("プロンプトを更新しました");
      } else {
        // 新規作成
        const created = await promptsApi.create({
          name: formData.name,
          description: formData.description || undefined,
          content: formData.content,
        });
        setPrompts([...prompts, created]);
        toast.success("プロンプトを作成しました");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save prompt:", error);
      toast.error(
        error instanceof ApiError ? error.message : "保存に失敗しました"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 削除
  const handleDelete = async (id: string) => {
    const prompt = prompts.find((p) => p.id === id);
    if (prompt?.isDefault) {
      toast.error("デフォルトプロンプトは削除できません");
      return;
    }

    try {
      await promptsApi.delete(id);
      setPrompts(prompts.filter((p) => p.id !== id));
      toast.success("プロンプトを削除しました");
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      toast.error(
        error instanceof ApiError ? error.message : "削除に失敗しました"
      );
    }
  };

  // デフォルト設定
  const toggleDefault = async (id: string) => {
    try {
      const updated = await promptsApi.setDefault(id);
      setPrompts(
        prompts.map((p) => ({
          ...p,
          isDefault: p.id === updated.id,
        }))
      );
      toast.success("デフォルトプロンプトを設定しました");
    } catch (error) {
      console.error("Failed to set default:", error);
      toast.error(
        error instanceof ApiError ? error.message : "設定に失敗しました"
      );
    }
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP");
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <DialogContent className="w-[90vw] max-w-none sm:max-w-none max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingPrompt ? "プロンプトを編集" : "新規プロンプト作成"}
              </DialogTitle>
              <DialogDescription>
                レビューに使用するプロンプトテンプレートを設定します
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
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
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.content || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
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
                {prompt.description || "説明なし"}
              </p>
              <div className="rounded-md bg-muted p-2">
                <pre className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                  {prompt.content}
                </pre>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  作成日: {formatDate(prompt.createdAt)}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleDefault(prompt.id)}
                    title={prompt.isDefault ? "デフォルト（変更不可）" : "デフォルトに設定"}
                    disabled={prompt.isDefault}
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
                    disabled={prompt.isDefault}
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
