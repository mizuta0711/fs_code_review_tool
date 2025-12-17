import { create } from "zustand";

export interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

interface FileStore {
  // 状態
  files: CodeFile[];
  activeFileId: string | null;

  // アクション
  addFile: (file?: Partial<CodeFile>) => string;
  removeFile: (id: string) => void;
  updateFile: (id: string, updates: Partial<CodeFile>) => void;
  setActiveFile: (id: string) => void;
  clearFiles: () => void;
  setFiles: (files: CodeFile[]) => void;
}

// ユニークIDを生成
const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 言語を拡張子から推測
const detectLanguage = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    rb: "ruby",
    go: "go",
    rs: "rust",
    php: "php",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    md: "markdown",
    sql: "sql",
    sh: "shell",
    yml: "yaml",
    yaml: "yaml",
  };
  return languageMap[ext || ""] || "plaintext";
};

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  activeFileId: null,

  addFile: (file = {}) => {
    const id = generateId();
    const newFile: CodeFile = {
      id,
      name: file.name || "新規ファイル.txt",
      language: file.language || detectLanguage(file.name || ""),
      content: file.content || "",
    };

    set((state) => ({
      files: [...state.files, newFile],
      activeFileId: state.files.length === 0 ? id : state.activeFileId,
    }));

    return id;
  },

  removeFile: (id) => {
    set((state) => {
      const newFiles = state.files.filter((f) => f.id !== id);
      let newActiveId = state.activeFileId;

      // 削除したファイルがアクティブだった場合、別のファイルをアクティブにする
      if (state.activeFileId === id) {
        const deletedIndex = state.files.findIndex((f) => f.id === id);
        if (newFiles.length > 0) {
          // 前のファイルか、なければ最初のファイルをアクティブにする
          const newIndex = Math.max(0, deletedIndex - 1);
          newActiveId = newFiles[newIndex]?.id || null;
        } else {
          newActiveId = null;
        }
      }

      return {
        files: newFiles,
        activeFileId: newActiveId,
      };
    });
  },

  updateFile: (id, updates) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.id === id
          ? {
              ...f,
              ...updates,
              // 名前が変更された場合は言語も更新
              language: updates.name ? detectLanguage(updates.name) : (updates.language ?? f.language),
            }
          : f
      ),
    }));
  },

  setActiveFile: (id) => {
    const file = get().files.find((f) => f.id === id);
    if (file) {
      set({ activeFileId: id });
    }
  },

  clearFiles: () => {
    set({ files: [], activeFileId: null });
  },

  setFiles: (files) => {
    set({
      files,
      activeFileId: files.length > 0 ? files[0].id : null,
    });
  },
}));
