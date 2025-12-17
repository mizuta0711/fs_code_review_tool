import { create } from "zustand";

export type AIProvider = "gemini" | "azure-openai";

interface ProviderStatus {
  configured: boolean;
}

interface Settings {
  id: string;
  aiProvider: AIProvider;
  providerStatus: {
    gemini: ProviderStatus;
    "azure-openai": ProviderStatus;
  };
}

interface SettingsStore {
  // 状態
  settings: Settings | null;
  loading: boolean;
  error: string | null;

  // アクション
  setSettings: (settings: Settings) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateProvider: (provider: AIProvider) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: false,
  error: null,

  setSettings: (settings) => {
    set({ settings, error: null });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setError: (error) => {
    set({ error });
  },

  updateProvider: (provider) => {
    set((state) => ({
      settings: state.settings
        ? { ...state.settings, aiProvider: provider }
        : null,
    }));
  },
}));
