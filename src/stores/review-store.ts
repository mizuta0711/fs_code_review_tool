import { create } from "zustand";

export interface ReviewedFile {
  id: string;
  name: string;
  language: string;
  content: string;
}

export type ReviewStatus = "idle" | "loading" | "success" | "error";

interface ReviewResult {
  reviewedFiles: ReviewedFile[];
  provider: string;
  promptId: string;
  promptName: string;
}

interface ReviewStore {
  // 状態
  status: ReviewStatus;
  result: ReviewResult | null;
  error: string | null;
  activeResultFileId: string | null;

  // アクション
  setLoading: () => void;
  setSuccess: (result: ReviewResult) => void;
  setError: (error: string) => void;
  reset: () => void;
  setActiveResultFile: (id: string) => void;
}

export const useReviewStore = create<ReviewStore>((set) => ({
  status: "idle",
  result: null,
  error: null,
  activeResultFileId: null,

  setLoading: () => {
    set({
      status: "loading",
      result: null,
      error: null,
    });
  },

  setSuccess: (result) => {
    set({
      status: "success",
      result,
      error: null,
      activeResultFileId: result.reviewedFiles[0]?.id || null,
    });
  },

  setError: (error) => {
    set({
      status: "error",
      result: null,
      error,
    });
  },

  reset: () => {
    set({
      status: "idle",
      result: null,
      error: null,
      activeResultFileId: null,
    });
  },

  setActiveResultFile: (id) => {
    set({ activeResultFileId: id });
  },
}));
