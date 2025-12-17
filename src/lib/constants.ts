/**
 * アプリケーション全体で使用する定数
 */

// =============================================================================
// AIプロバイダー関連
// =============================================================================

export const AI_PROVIDERS = {
  GEMINI: "gemini",
  AZURE_OPENAI: "azure-openai",
} as const;

export const VALID_AI_PROVIDERS = Object.values(AI_PROVIDERS);

export type AIProviderType = (typeof AI_PROVIDERS)[keyof typeof AI_PROVIDERS];

// =============================================================================
// バリデーション関連
// =============================================================================

export const VALIDATION = {
  /** プロンプト名の最大文字数 */
  PROMPT_NAME_MAX_LENGTH: 100,
  /** プロンプト内容の最大文字数 */
  PROMPT_CONTENT_MAX_LENGTH: 50000,
  /** プロンプト説明の最大文字数 */
  PROMPT_DESCRIPTION_MAX_LENGTH: 500,
  /** ファイル名の最大文字数 */
  FILE_NAME_MAX_LENGTH: 255,
  /** ファイル内容の最大文字数 */
  FILE_CONTENT_MAX_LENGTH: 100000,
} as const;

// =============================================================================
// HTTPステータスコード
// =============================================================================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// =============================================================================
// エラーコード
// =============================================================================

export const ERROR_CODES = {
  // 共通
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",

  // プロンプト関連
  PROMPT_NOT_FOUND: "PROMPT_NOT_FOUND",
  PROMPT_CREATE_FAILED: "PROMPT_CREATE_FAILED",
  PROMPT_UPDATE_FAILED: "PROMPT_UPDATE_FAILED",
  PROMPT_DELETE_FAILED: "PROMPT_DELETE_FAILED",
  PROMPT_CANNOT_DELETE_DEFAULT: "PROMPT_CANNOT_DELETE_DEFAULT",

  // 設定関連
  SETTINGS_FETCH_FAILED: "SETTINGS_FETCH_FAILED",
  SETTINGS_UPDATE_FAILED: "SETTINGS_UPDATE_FAILED",
  INVALID_AI_PROVIDER: "INVALID_AI_PROVIDER",

  // レビュー関連
  REVIEW_FILES_REQUIRED: "REVIEW_FILES_REQUIRED",
  REVIEW_FILE_INVALID: "REVIEW_FILE_INVALID",
  REVIEW_DEFAULT_PROMPT_NOT_SET: "REVIEW_DEFAULT_PROMPT_NOT_SET",
  REVIEW_AI_CLIENT_INIT_FAILED: "REVIEW_AI_CLIENT_INIT_FAILED",
  REVIEW_TIMEOUT: "REVIEW_TIMEOUT",
  REVIEW_RATE_LIMITED: "REVIEW_RATE_LIMITED",
  REVIEW_FAILED: "REVIEW_FAILED",
} as const;

// =============================================================================
// エラーメッセージ
// =============================================================================

export const ERROR_MESSAGES = {
  // 共通
  COMMON: {
    VALIDATION_ERROR: "入力内容に誤りがあります",
    INTERNAL_ERROR: "内部エラーが発生しました",
    NOT_FOUND: "リソースが見つかりません",
  },

  // プロンプト関連
  PROMPT: {
    NOT_FOUND: "プロンプトが見つかりません",
    NAME_REQUIRED: "プロンプト名は必須です",
    NAME_TOO_LONG: `プロンプト名は${VALIDATION.PROMPT_NAME_MAX_LENGTH}文字以内で入力してください`,
    NAME_EMPTY: "プロンプト名は空にできません",
    CONTENT_REQUIRED: "プロンプト内容は必須です",
    CONTENT_TOO_LONG: `プロンプト内容は${VALIDATION.PROMPT_CONTENT_MAX_LENGTH}文字以内で入力してください`,
    CONTENT_EMPTY: "プロンプト内容は空にできません",
    DESCRIPTION_TOO_LONG: `説明は${VALIDATION.PROMPT_DESCRIPTION_MAX_LENGTH}文字以内で入力してください`,
    CANNOT_DELETE_DEFAULT: "デフォルトプロンプトは削除できません",
    FETCH_FAILED: "プロンプトの取得に失敗しました",
    CREATE_FAILED: "プロンプトの作成に失敗しました",
    UPDATE_FAILED: "プロンプトの更新に失敗しました",
    DELETE_FAILED: "プロンプトの削除に失敗しました",
    SET_DEFAULT_FAILED: "デフォルトプロンプトの設定に失敗しました",
  },

  // 設定関連
  SETTINGS: {
    FETCH_FAILED: "設定の取得に失敗しました",
    UPDATE_FAILED: "設定の更新に失敗しました",
    INVALID_PROVIDER: (validProviders: string[]) =>
      `無効なAIプロバイダーです。有効な値: ${validProviders.join(", ")}`,
  },

  // レビュー関連
  REVIEW: {
    FILES_REQUIRED: "レビュー対象のファイルが必要です",
    FILE_NAME_REQUIRED: "ファイル名は必須です",
    FILE_CONTENT_REQUIRED: "ファイル内容は必須です",
    FILE_INVALID: "ファイル名とコンテンツは必須です",
    PROMPT_NOT_FOUND: "指定されたプロンプトが見つかりません",
    DEFAULT_PROMPT_NOT_SET: "デフォルトプロンプトが設定されていません",
    AI_CLIENT_INIT_FAILED: (provider: string) =>
      `AIクライアントの初期化に失敗しました: ${provider}の設定を確認してください`,
    TIMEOUT: "レビューがタイムアウトしました。コードを小分けにして再試行してください",
    RATE_LIMITED: "API利用制限に達しました。しばらく待ってから再試行してください",
    FAILED: "レビューの実行に失敗しました",
  },
} as const;

// =============================================================================
// デフォルト値
// =============================================================================

export const DEFAULTS = {
  /** デフォルトのAIプロバイダー */
  AI_PROVIDER: AI_PROVIDERS.GEMINI,
  /** デフォルトの設定ID */
  SETTINGS_ID: "default",
} as const;
