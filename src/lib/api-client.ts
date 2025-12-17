// API Client for frontend

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(error.error || "リクエストに失敗しました", response.status);
  }
  return response.json();
}

// Prompts API
export interface Prompt {
  id: string;
  name: string;
  description: string | null;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const promptsApi = {
  list: async (): Promise<Prompt[]> => {
    const response = await fetch("/api/prompts");
    return handleResponse<Prompt[]>(response);
  },

  get: async (id: string): Promise<Prompt> => {
    const response = await fetch(`/api/prompts/${id}`);
    return handleResponse<Prompt>(response);
  },

  create: async (data: { name: string; description?: string; content: string }): Promise<Prompt> => {
    const response = await fetch("/api/prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Prompt>(response);
  },

  update: async (id: string, data: { name?: string; description?: string; content?: string }): Promise<Prompt> => {
    const response = await fetch(`/api/prompts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Prompt>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/prompts/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new ApiError(error.error || "削除に失敗しました", response.status);
    }
  },

  setDefault: async (id: string): Promise<Prompt> => {
    const response = await fetch(`/api/prompts/${id}/default`, {
      method: "PUT",
    });
    return handleResponse<Prompt>(response);
  },
};

// Settings API
export interface ProviderStatus {
  configured: boolean;
}

export interface Settings {
  id: string;
  aiProvider: "gemini" | "azure-openai";
  providerStatus: {
    gemini: ProviderStatus;
    "azure-openai": ProviderStatus;
  };
}

export const settingsApi = {
  get: async (): Promise<Settings> => {
    const response = await fetch("/api/settings");
    return handleResponse<Settings>(response);
  },

  update: async (data: { aiProvider: string }): Promise<Settings> => {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<Settings>(response);
  },
};

// Review API
export interface CodeFile {
  name: string;
  language: string;
  content: string;
}

export interface ReviewedFile {
  name: string;
  language: string;
  content: string;
}

export interface ReviewResult {
  reviewedFiles: ReviewedFile[];
  provider: string;
  promptId: string;
  promptName: string;
}

export const reviewApi = {
  execute: async (files: CodeFile[], promptId?: string): Promise<ReviewResult> => {
    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files, promptId }),
    });
    return handleResponse<ReviewResult>(response);
  },
};
