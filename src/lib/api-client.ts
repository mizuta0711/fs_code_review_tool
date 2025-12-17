// API Client for frontend

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(error.error || "リクエストに失敗しました", response.status, error.code);
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
      throw new ApiError(error.error || "削除に失敗しました", response.status, error.code);
    }
  },

  setDefault: async (id: string): Promise<Prompt> => {
    const response = await fetch(`/api/prompts/${id}/default`, {
      method: "PUT",
    });
    return handleResponse<Prompt>(response);
  },
};

// AI Provider types
export type AIProviderType = "gemini" | "azure-openai" | "claude";

export interface AIProviderListItem {
  id: string;
  name: string;
  provider: AIProviderType;
  endpoint: string | null;
  deployment: string | null;
  model: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAIProviderInput {
  name: string;
  provider: AIProviderType;
  apiKey: string;
  endpoint?: string;
  deployment?: string;
  model?: string;
  password: string;
}

export interface UpdateAIProviderInput {
  name?: string;
  provider?: AIProviderType;
  apiKey?: string;
  endpoint?: string;
  deployment?: string;
  model?: string;
  password?: string;
}

// AI Provider API
export const aiProviderApi = {
  list: async (): Promise<AIProviderListItem[]> => {
    const response = await fetch("/api/ai-providers");
    return handleResponse<AIProviderListItem[]>(response);
  },

  get: async (id: string): Promise<AIProviderListItem> => {
    const response = await fetch(`/api/ai-providers/${id}`);
    return handleResponse<AIProviderListItem>(response);
  },

  create: async (data: CreateAIProviderInput): Promise<AIProviderListItem> => {
    const response = await fetch("/api/ai-providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<AIProviderListItem>(response);
  },

  update: async (id: string, data: UpdateAIProviderInput): Promise<AIProviderListItem> => {
    const response = await fetch(`/api/ai-providers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<AIProviderListItem>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/ai-providers/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new ApiError(error.error || "削除に失敗しました", response.status, error.code);
    }
  },

  activate: async (id: string): Promise<AIProviderListItem> => {
    const response = await fetch(`/api/ai-providers/${id}/activate`, {
      method: "POST",
    });
    return handleResponse<AIProviderListItem>(response);
  },

  verifyPassword: async (id: string, password: string): Promise<{ valid: boolean }> => {
    const response = await fetch(`/api/ai-providers/${id}/verify-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    return handleResponse<{ valid: boolean }>(response);
  },
};

// Settings API
export interface ProviderStatus {
  configured: boolean;
}

export interface Settings {
  id: string;
  activeProviderId: string | null;
  activeProvider: AIProviderListItem | null;
  providerStatus: {
    gemini: ProviderStatus;
    "azure-openai": ProviderStatus;
    claude: ProviderStatus;
  };
  updatedAt: string;
}

export const settingsApi = {
  get: async (): Promise<Settings> => {
    const response = await fetch("/api/settings");
    return handleResponse<Settings>(response);
  },

  update: async (data: { activeProviderId?: string | null }): Promise<Settings> => {
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
  providerName: string;
  promptId: string;
  promptName: string;
}

export interface ReviewRequest {
  files: CodeFile[];
  promptId?: string;
  password: string;
}

export const reviewApi = {
  execute: async (data: ReviewRequest): Promise<ReviewResult> => {
    const response = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<ReviewResult>(response);
  },
};
