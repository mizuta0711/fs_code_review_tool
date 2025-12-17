"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Monaco Editorを動的インポート（SSR無効）
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// モック用のプロンプトデータ
const mockPrompts = [
  { id: "1", name: "Java基本レビュー" },
  { id: "2", name: "中級編AIコードレビュープロンプト" },
  { id: "3", name: "TypeScriptレビュー" },
];

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

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("input");
  const [files, setFiles] = useState<CodeFile[]>([
    { id: "1", name: "Main.java", content: "", language: "java", reviewedContent: null },
  ]);
  const [activeFileId, setActiveFileId] = useState("1");
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId);
  const hasReviewResults = files.some((f) => f.reviewedContent !== null);
  const filesWithContent = files.filter((f) => f.content.trim());
  const reviewedFiles = files.filter((f) => f.reviewedContent);

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

  // レビュー実行
  const executeReview = async () => {
    if (!selectedPrompt) {
      toast.error("プロンプトを選択してください");
      return;
    }
    if (filesWithContent.length === 0) {
      toast.error("レビュー対象のコードを入力してください");
      return;
    }

    setIsReviewing(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    setFiles(
      files.map((file) => {
        if (!file.content.trim()) return file;

        const mockResult = `// =============================================
// AIレビュー結果: ${file.name}
// =============================================

${file.content}

/*
 * ========================================
 * レビューコメント
 * ========================================
 *
 * [必須] Line 5: 変数名をより具体的に
 *   例: "data" → "userInputData"
 *
 * [意見] Line 12: メソッド分割を推奨
 *   この処理は別メソッドに切り出すと可読性向上
 *
 * [参考] Line 20: null チェック追加を推奨
 *   例: if (value != null) { ... }
 */`;

        return { ...file, reviewedContent: mockResult };
      })
    );

    setIsReviewing(false);
    setViewMode("result");
    setActiveFileId(filesWithContent[0].id);
    toast.success(`${filesWithContent.length}ファイルのレビュー完了`);
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
            <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="プロンプトを選択" />
              </SelectTrigger>
              <SelectContent>
                {mockPrompts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={executeReview}
              disabled={isReviewing || !selectedPrompt || filesWithContent.length === 0}
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
          >
            {viewMode === "input" ? (
              <Input
                value={file.name}
                onChange={(e) => updateFileName(file.id, e.target.value)}
                className="h-5 w-24 text-xs border-none bg-transparent p-0 focus-visible:ring-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm">{file.name}</span>
            )}
            {viewMode === "input" && files.length > 1 && (
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
    </div>
  );
}
