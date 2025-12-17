"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Plus,
  X,
  Copy,
  Download,
  Loader2,
  FileArchive,
  Upload,
  ArrowLeft,
  Code2,
  FileCheck,
  Key,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  promptsApi,
  reviewApi,
  aiProviderApi,
  settingsApi,
  type Prompt,
  type AIProviderListItem,
  ApiError,
} from "@/lib/api-client";

// Monaco Editorを動的インポート（SSR無効）
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ファイル拡張子から言語を判定
const getLanguageFromFileName = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    java: "java",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    rb: "ruby",
    php: "php",
    html: "html",
    css: "css",
    json: "json",
    xml: "xml",
    sql: "sql",
    sh: "shell",
    md: "markdown",
  };
  return languageMap[ext || ""] || "plaintext";
};

// ファイルの型定義
interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
  reviewedContent: string | null;
}

type ViewMode = "input" | "result";

// パスワードのローカルストレージキー
const PASSWORD_STORAGE_KEY = "ai_provider_password";

// パスワードをローカルストレージに保存
const savePassword = (providerId: string, password: string) => {
  try {
    const stored = JSON.parse(localStorage.getItem(PASSWORD_STORAGE_KEY) || "{}");
    stored[providerId] = password;
    localStorage.setItem(PASSWORD_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // 失敗しても続行
  }
};

// パスワードをローカルストレージから取得
const getStoredPassword = (providerId: string): string => {
  try {
    const stored = JSON.parse(localStorage.getItem(PASSWORD_STORAGE_KEY) || "{}");
    return stored[providerId] || "";
  } catch {
    return "";
  }
};

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("input");
  const [files, setFiles] = useState<CodeFile[]>([
    { id: "1", name: "Main.java", content: "", language: "java", reviewedContent: null },
  ]);
  const [activeFileId, setActiveFileId] = useState("1");
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // パスワードダイアログ関連
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // AIプロバイダー関連
  const [providers, setProviders] = useState<AIProviderListItem[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);

  // ファイル名編集関連
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState("");

  const activeFile = files.find((f) => f.id === activeFileId);
  const hasReviewResults = files.some((f) => f.reviewedContent !== null);
  const filesWithContent = files.filter((f) => f.content.trim());
  const reviewedFiles = files.filter((f) => f.reviewedContent);

  // プロンプト一覧を取得
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const data = await promptsApi.list();
        setPrompts(data);
        // デフォルトプロンプトを選択
        const defaultPrompt = data.find((p) => p.isDefault);
        if (defaultPrompt) {
          setSelectedPrompt(defaultPrompt.id);
        }
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
        toast.error("プロンプトの取得に失敗しました");
      } finally {
        setIsLoadingPrompts(false);
      }
    };
    fetchPrompts();
  }, []);

  // プロバイダー一覧を取得
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const [providerList, settings] = await Promise.all([
          aiProviderApi.list(),
          settingsApi.get(),
        ]);
        setProviders(providerList);
        // アクティブなプロバイダーがあれば選択、なければ最初のプロバイダーを選択
        if (settings.activeProviderId) {
          setSelectedProviderId(settings.activeProviderId);
        } else if (providerList.length > 0) {
          setSelectedProviderId(providerList[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch providers:", error);
      } finally {
        setIsLoadingProviders(false);
      }
    };
    fetchProviders();
  }, []);

  // 選択中のプロバイダー
  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  // ファイル追加
  const addFile = () => {
    const newId = String(Date.now());
    const newFileName = `File${files.length + 1}.java`;
    setFiles([
      ...files,
      {
        id: newId,
        name: newFileName,
        content: "",
        language: getLanguageFromFileName(newFileName),
        reviewedContent: null,
      },
    ]);
    setActiveFileId(newId);
  };

  // ファイル削除
  const removeFile = (id: string) => {
    if (files.length === 1) return;
    const newFiles = files.filter((f) => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) {
      setActiveFileId(newFiles[0].id);
    }
  };

  // ファイル名変更
  const updateFileName = (id: string, name: string) => {
    setFiles(
      files.map((f) =>
        f.id === id ? { ...f, name, language: getLanguageFromFileName(name) } : f
      )
    );
  };

  // ファイル名編集開始（ダブルクリック）
  const startEditingFileName = (fileId: string, currentName: string) => {
    setEditingFileId(fileId);
    setEditingFileName(currentName);
  };

  // ファイル名編集確定
  const finishEditingFileName = () => {
    if (editingFileId && editingFileName.trim()) {
      updateFileName(editingFileId, editingFileName.trim());
    }
    setEditingFileId(null);
    setEditingFileName("");
  };

  // ファイル名編集キャンセル（Escapeキー）
  const cancelEditingFileName = () => {
    setEditingFileId(null);
    setEditingFileName("");
  };

  // コード変更
  const updateFileContent = (id: string, content: string | undefined) => {
    setFiles(
      files.map((f) =>
        f.id === id ? { ...f, content: content || "", reviewedContent: null } : f
      )
    );
  };

  // ドラッグ&ドロップ処理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      const maxFiles = 10;
      const currentFileCount = files.length;
      const availableSlots = maxFiles - currentFileCount;
      const isFirstFileEmpty = files.length === 1 && files[0].content === "";

      if (availableSlots <= 0) {
        toast.error(`ファイル数が上限（${maxFiles}）に達しています`);
        return;
      }

      const filesToRead = droppedFiles.slice(0, availableSlots);

      // 最初のファイルのIDを事前に決定
      const firstNewFileId = isFirstFileEmpty ? files[0].id : String(Date.now());
      let isFirstFile = true;

      filesToRead.forEach((file, index) => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} は10MBを超えているためスキップしました`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          const newId = index === 0 ? firstNewFileId : String(Date.now() + index);
          const language = getLanguageFromFileName(file.name);

          setFiles((prev) => {
            if (isFirstFileEmpty && isFirstFile) {
              isFirstFile = false;
              return [{ id: prev[0].id, name: file.name, content, language, reviewedContent: null }];
            }
            return [...prev, { id: newId, name: file.name, content, language, reviewedContent: null }];
          });
        };
        reader.readAsText(file);
      });

      // 最初のファイルのタブに切り替え
      setActiveFileId(firstNewFileId);

      setTimeout(() => {
        toast.success(
          filesToRead.length === 1
            ? `${filesToRead[0].name} を読み込みました`
            : `${filesToRead.length}ファイルを読み込みました`
        );
      }, 100);
    },
    [files]
  );

  // レビュー実行ボタンクリック
  const handleReviewClick = () => {
    if (!selectedPrompt) {
      toast.error("プロンプトを選択してください");
      return;
    }
    if (filesWithContent.length === 0) {
      toast.error("レビュー対象のコードを入力してください");
      return;
    }
    if (!selectedProvider) {
      toast.error("AIプロバイダーを選択してください。");
      return;
    }

    // パスワードが設定されていない場合は直接実行
    if (!selectedProvider.hasPassword) {
      executeReview();
      return;
    }

    // 保存済みパスワードがあれば自動入力
    const storedPassword = getStoredPassword(selectedProvider.id);
    setPassword(storedPassword);
    setPasswordError("");
    setIsPasswordDialogOpen(true);
  };

  // レビュー実行
  const executeReview = async () => {
    // パスワードが必要な場合のチェック
    if (selectedProvider?.hasPassword && !password) {
      setPasswordError("パスワードを入力してください");
      return;
    }

    setIsPasswordDialogOpen(false);
    setIsReviewing(true);

    try {
      const result = await reviewApi.execute({
        files: filesWithContent.map((f) => ({
          name: f.name,
          language: f.language,
          content: f.content,
        })),
        promptId: selectedPrompt,
        providerId: selectedProviderId,
        password: selectedProvider?.hasPassword ? password : undefined,
      });

      // パスワードを保存
      if (selectedProvider?.hasPassword && password) {
        savePassword(selectedProvider.id, password);
      }

      // レビュー結果をファイルに反映
      setFiles(
        files.map((file) => {
          const reviewed = result.reviewedFiles.find((r) => r.name === file.name);
          if (reviewed) {
            return { ...file, reviewedContent: reviewed.content };
          }
          return file;
        })
      );

      setViewMode("result");
      setActiveFileId(filesWithContent[0].id);
      toast.success(`${filesWithContent.length}ファイルのレビュー完了`);
    } catch (error) {
      console.error("Review failed:", error);
      if (error instanceof ApiError && error.code === "REVIEW_PASSWORD_INVALID") {
        // パスワード不正の場合は再度ダイアログを開く
        setPasswordError("パスワードが正しくありません");
        setIsPasswordDialogOpen(true);
      } else {
        toast.error(
          error instanceof Error ? error.message : "レビューの実行に失敗しました"
        );
      }
    } finally {
      setIsReviewing(false);
    }
  };

  // コピー
  const copyToClipboard = () => {
    if (activeFile?.reviewedContent) {
      navigator.clipboard.writeText(activeFile.reviewedContent);
      toast.success("コピーしました");
    }
  };

  // ダウンロード
  const downloadFile = () => {
    if (activeFile?.reviewedContent) {
      const blob = new Blob([activeFile.reviewedContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reviewed_${activeFile.name}`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // 全ファイルダウンロード
  const downloadAllFiles = () => {
    reviewedFiles.forEach((file, index) => {
      setTimeout(() => {
        const blob = new Blob([file.reviewedContent!], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reviewed_${file.name}`;
        a.click();
        URL.revokeObjectURL(url);
      }, index * 200);
    });
    toast.success(`${reviewedFiles.length}ファイルをダウンロード`);
  };

  // 入力画面に戻る
  const backToInput = () => {
    setViewMode("input");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] px-4">
      {/* 画面切り替えタブ */}
      <div className="flex items-center justify-between mb-4">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="input" className="gap-2">
              <Code2 className="h-4 w-4" />
              コード入力
            </TabsTrigger>
            <TabsTrigger value="result" disabled={!hasReviewResults} className="gap-2">
              <FileCheck className="h-4 w-4" />
              レビュー結果
              {hasReviewResults && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {reviewedFiles.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode === "input" && (
          <div className="flex items-center gap-3">
            <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={isLoadingProviders ? "読み込み中..." : "プロバイダー"} />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.isActive && " (デフォルト)"}
                    {!p.hasPassword && " [PW無し]"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={isLoadingPrompts ? "読み込み中..." : "プロンプトを選択"} />
              </SelectTrigger>
              <SelectContent>
                {prompts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                    {p.isDefault && " (デフォルト)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleReviewClick}
              disabled={
                isReviewing ||
                !selectedPrompt ||
                filesWithContent.length === 0 ||
                isLoadingProviders ||
                !selectedProviderId
              }
            >
              {isReviewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  レビュー実行
                  {filesWithContent.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {filesWithContent.length}
                    </Badge>
                  )}
                </>
              )}
            </Button>
          </div>
        )}

        {viewMode === "result" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-1" />
              コピー
            </Button>
            <Button variant="outline" size="sm" onClick={downloadFile}>
              <Download className="h-4 w-4 mr-1" />
              DL
            </Button>
            {reviewedFiles.length > 1 && (
              <Button variant="outline" size="sm" onClick={downloadAllFiles}>
                <FileArchive className="h-4 w-4 mr-1" />
                全DL
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={backToInput}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              戻る
            </Button>
          </div>
        )}
      </div>

      {/* AIプロバイダー未設定の警告 */}
      {!isLoadingProviders && providers.length === 0 && viewMode === "input" && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span>
            AIプロバイダーが設定されていません。
            <a href="/settings" className="underline ml-1 font-medium">
              設定画面
            </a>
            から登録してください。
          </span>
        </div>
      )}

      {/* ファイルタブ */}
      <div className="flex items-center gap-1 border-b bg-muted/30 px-2 rounded-t-lg">
        {(viewMode === "input" ? files : reviewedFiles).map((file) => (
          <div
            key={file.id}
            className={cn(
              "flex items-center gap-1 px-3 py-2 cursor-pointer transition-colors border-b-2 -mb-[2px]",
              activeFileId === file.id
                ? "border-primary bg-background"
                : "border-transparent hover:bg-muted/50"
            )}
            onClick={() => setActiveFileId(file.id)}
            onDoubleClick={(e) => {
              if (viewMode === "input") {
                e.stopPropagation();
                startEditingFileName(file.id, file.name);
              }
            }}
          >
            {viewMode === "input" && editingFileId === file.id ? (
              <Input
                value={editingFileName}
                onChange={(e) => setEditingFileName(e.target.value)}
                onBlur={finishEditingFileName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    finishEditingFileName();
                  } else if (e.key === "Escape") {
                    cancelEditingFileName();
                  }
                }}
                className="h-5 w-28 text-xs border border-primary bg-background px-1 focus-visible:ring-1"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span className="text-sm truncate max-w-[120px]" title={file.name}>
                {file.name}
              </span>
            )}
            {viewMode === "input" && files.length > 1 && editingFileId !== file.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="text-muted-foreground hover:text-foreground ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        {viewMode === "input" && files.length < 10 && (
          <Button variant="ghost" size="sm" onClick={addFile} className="h-8 px-2 ml-1">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* エディタエリア */}
      <div
        ref={dropZoneRef}
        className={cn(
          "flex-1 relative border border-t-0 rounded-b-lg overflow-hidden",
          isDragOver && "ring-2 ring-primary ring-inset"
        )}
        onDragOver={viewMode === "input" ? handleDragOver : undefined}
        onDragLeave={viewMode === "input" ? handleDragLeave : undefined}
        onDrop={viewMode === "input" ? handleDrop : undefined}
      >
        {/* ローディングオーバーレイ */}
        {isReviewing && (
          <div className="absolute inset-0 bg-background/80 z-20 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <p className="mt-3 text-sm text-muted-foreground">
                {filesWithContent.length}ファイルをレビュー中...
              </p>
            </div>
          </div>
        )}

        {/* ドラッグオーバーレイ */}
        {isDragOver && viewMode === "input" && (
          <div className="absolute inset-0 bg-primary/5 z-10 flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-12 w-12 text-primary mx-auto" />
              <p className="mt-2 font-medium">ファイルをドロップ</p>
              <p className="text-sm text-muted-foreground">複数ファイル対応</p>
            </div>
          </div>
        )}

        {/* 入力モード */}
        {viewMode === "input" && (
          <>
            <Editor
              height="100%"
              language={activeFile?.language || "java"}
              value={activeFile?.content || ""}
              onChange={(value) => updateFileContent(activeFileId, value)}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                padding: { top: 16 },
              }}
            />
            {!activeFile?.content && !isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-muted-foreground/60">
                  <Upload className="h-10 w-10 mx-auto mb-3" />
                  <p>コードを入力、またはファイルをドラッグ&ドロップ</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* 結果モード */}
        {viewMode === "result" && (
          <Editor
            height="100%"
            language={activeFile?.language || "java"}
            value={activeFile?.reviewedContent || ""}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
              padding: { top: 16 },
            }}
          />
        )}
      </div>

      {/* パスワード入力ダイアログ */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              パスワードを入力
            </DialogTitle>
            <DialogDescription>
              {selectedProvider?.name} を使用するためのパスワードを入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="review-password">パスワード</Label>
              <Input
                id="review-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                placeholder="パスワードを入力"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeReview();
                  }
                }}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {passwordError}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={executeReview} disabled={!password}>
              レビュー開始
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
