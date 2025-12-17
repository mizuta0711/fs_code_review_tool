/**
 * 構造化ログユーティリティ
 * アプリケーション全体で一貫したログ出力を提供
 */

// ログレベル定義
export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

export type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

// ログコンテキスト型
interface LogContext {
  /** リクエストID（トレーシング用） */
  requestId?: string;
  /** 処理対象のリソースID */
  resourceId?: string;
  /** 処理にかかった時間（ms） */
  duration?: number;
  /** 追加のメタデータ */
  [key: string]: unknown;
}

// ログエントリ型
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * 現在のログレベルを取得
 * 環境変数 LOG_LEVEL で設定可能（デフォルト: info）
 */
function getCurrentLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (level && Object.values(LOG_LEVELS).includes(level as LogLevel)) {
    return level as LogLevel;
  }
  return process.env.NODE_ENV === "development" ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
}

/**
 * ログレベルの優先度を取得
 */
function getLogLevelPriority(level: LogLevel): number {
  const priorities: Record<LogLevel, number> = {
    [LOG_LEVELS.DEBUG]: 0,
    [LOG_LEVELS.INFO]: 1,
    [LOG_LEVELS.WARN]: 2,
    [LOG_LEVELS.ERROR]: 3,
  };
  return priorities[level];
}

/**
 * 指定レベルのログを出力すべきか判定
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevel = getCurrentLogLevel();
  return getLogLevelPriority(level) >= getLogLevelPriority(currentLevel);
}

/**
 * ログエントリをフォーマット
 */
function formatLogEntry(entry: LogEntry): string {
  // 開発環境では読みやすい形式
  if (process.env.NODE_ENV === "development") {
    const { timestamp, level, message, context, error } = entry;
    const levelColor = {
      debug: "\x1b[36m", // cyan
      info: "\x1b[32m",  // green
      warn: "\x1b[33m",  // yellow
      error: "\x1b[31m", // red
    }[level];
    const reset = "\x1b[0m";

    let output = `${timestamp} ${levelColor}[${level.toUpperCase()}]${reset} ${message}`;

    if (context && Object.keys(context).length > 0) {
      output += ` ${JSON.stringify(context)}`;
    }

    if (error) {
      output += `\n  Error: ${error.name}: ${error.message}`;
      if (error.stack) {
        output += `\n  ${error.stack}`;
      }
    }

    return output;
  }

  // 本番環境ではJSON形式（ログ収集ツール用）
  return JSON.stringify(entry);
}

/**
 * ログを出力
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (context && Object.keys(context).length > 0) {
    entry.context = context;
  }

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  const output = formatLogEntry(entry);

  switch (level) {
    case LOG_LEVELS.DEBUG:
      console.debug(output);
      break;
    case LOG_LEVELS.INFO:
      console.info(output);
      break;
    case LOG_LEVELS.WARN:
      console.warn(output);
      break;
    case LOG_LEVELS.ERROR:
      console.error(output);
      break;
  }
}

/**
 * ロガーインスタンス
 */
export const logger = {
  /**
   * デバッグログ
   */
  debug: (message: string, context?: LogContext): void => {
    log(LOG_LEVELS.DEBUG, message, context);
  },

  /**
   * 情報ログ
   */
  info: (message: string, context?: LogContext): void => {
    log(LOG_LEVELS.INFO, message, context);
  },

  /**
   * 警告ログ
   */
  warn: (message: string, context?: LogContext, error?: Error): void => {
    log(LOG_LEVELS.WARN, message, context, error);
  },

  /**
   * エラーログ
   */
  error: (message: string, context?: LogContext, error?: Error): void => {
    log(LOG_LEVELS.ERROR, message, context, error);
  },

  /**
   * APIリクエスト開始ログ
   */
  apiRequest: (method: string, path: string, context?: LogContext): void => {
    log(LOG_LEVELS.INFO, `API Request: ${method} ${path}`, context);
  },

  /**
   * APIレスポンスログ
   */
  apiResponse: (method: string, path: string, status: number, duration: number, context?: LogContext): void => {
    const level = status >= 500 ? LOG_LEVELS.ERROR : status >= 400 ? LOG_LEVELS.WARN : LOG_LEVELS.INFO;
    log(level, `API Response: ${method} ${path} ${status}`, { ...context, duration });
  },

  /**
   * サービス層の処理開始ログ
   */
  serviceStart: (serviceName: string, method: string, context?: LogContext): void => {
    log(LOG_LEVELS.DEBUG, `Service: ${serviceName}.${method} started`, context);
  },

  /**
   * サービス層の処理完了ログ
   */
  serviceEnd: (serviceName: string, method: string, duration: number, context?: LogContext): void => {
    log(LOG_LEVELS.DEBUG, `Service: ${serviceName}.${method} completed`, { ...context, duration });
  },

  /**
   * データベース操作ログ
   */
  dbOperation: (operation: string, table: string, context?: LogContext): void => {
    log(LOG_LEVELS.DEBUG, `DB: ${operation} on ${table}`, context);
  },
};

/**
 * 処理時間計測ユーティリティ
 */
export function createTimer(): { elapsed: () => number } {
  const start = Date.now();
  return {
    elapsed: () => Date.now() - start,
  };
}

/**
 * ユニークなリクエストIDを生成
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
