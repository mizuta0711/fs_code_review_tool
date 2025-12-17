/**
 * API関連の共通型定義
 */

/**
 * APIエラーレスポンス
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * API成功レスポンス（メッセージのみ）
 */
export interface ApiSuccessResponse {
  message: string;
}

/**
 * Next.js App Router のルートパラメータ型
 */
export interface RouteParams<T = { id: string }> {
  params: Promise<T>;
}

/**
 * ページネーションパラメータ
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * ページネーション結果
 */
export interface PaginationResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
