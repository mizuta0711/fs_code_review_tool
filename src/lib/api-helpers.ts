/**
 * API実装のための共通ヘルパー関数群
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { HTTP_STATUS } from "./constants";
import type { ApiErrorResponse } from "@/types/api";

// =============================================================================
// レスポンス生成ヘルパー
// =============================================================================

/**
 * 成功レスポンスを生成
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = HTTP_STATUS.OK
): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * エラーレスポンスを生成
 */
export function createErrorResponse(
  message: string,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  code?: string
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = { error: message };
  if (code) {
    body.code = code;
  }
  return NextResponse.json(body, { status });
}

/**
 * 404 Not Found レスポンスを生成
 */
export function createNotFoundResponse(
  message: string,
  code?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, HTTP_STATUS.NOT_FOUND, code);
}

/**
 * 400 Bad Request レスポンスを生成
 */
export function createBadRequestResponse(
  message: string,
  code?: string
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(message, HTTP_STATUS.BAD_REQUEST, code);
}

// =============================================================================
// バリデーションヘルパー
// =============================================================================

/**
 * バリデーション結果の型
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse<ApiErrorResponse> };

/**
 * リクエストボディをバリデーション
 * @param schema Zodスキーマ
 * @param data バリデーション対象のデータ
 * @returns バリデーション結果
 */
export function validateRequestBody<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errorMessage =
      result.error.issues[0]?.message || "バリデーションエラー";
    return {
      success: false,
      error: createBadRequestResponse(errorMessage, "VALIDATION_ERROR"),
    };
  }

  return { success: true, data: result.data };
}

/**
 * クエリパラメータをバリデーション
 * @param schema Zodスキーマ
 * @param searchParams URLSearchParams
 * @returns バリデーション結果
 */
export function validateQueryParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): ValidationResult<T> {
  const params: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    if (params[key]) {
      // 複数値がある場合は配列に
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });

  return validateRequestBody(schema, params);
}

// =============================================================================
// エラーハンドリングヘルパー
// =============================================================================

/**
 * カスタムエラークラス: アプリケーションエラー
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * カスタムエラークラス: Not Found
 */
export class NotFoundError extends AppError {
  constructor(message: string, code?: string) {
    super(message, HTTP_STATUS.NOT_FOUND, code || "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * カスタムエラークラス: バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.BAD_REQUEST, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * カスタムエラークラス: ビジネスロジックエラー
 */
export class BusinessError extends AppError {
  constructor(message: string, code?: string) {
    super(message, HTTP_STATUS.BAD_REQUEST, code || "BUSINESS_ERROR");
    this.name = "BusinessError";
  }
}

/**
 * カスタムエラークラス: 認証エラー
 */
export class UnauthorizedError extends AppError {
  constructor(message: string, code?: string) {
    super(message, HTTP_STATUS.UNAUTHORIZED, code || "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/**
 * エラーをAPIレスポンスに変換
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // AppErrorの場合
  if (error instanceof AppError) {
    return createErrorResponse(error.message, error.statusCode, error.code);
  }

  // Zodエラーの場合
  if (error instanceof z.ZodError) {
    const message = error.issues[0]?.message || "バリデーションエラー";
    return createBadRequestResponse(message, "VALIDATION_ERROR");
  }

  // 一般的なErrorの場合
  if (error instanceof Error) {
    console.error("Unexpected error:", error);
    return createErrorResponse(
      "内部エラーが発生しました",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "INTERNAL_ERROR"
    );
  }

  // 不明なエラー
  console.error("Unknown error:", error);
  return createErrorResponse(
    "予期しないエラーが発生しました",
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    "UNKNOWN_ERROR"
  );
}

// =============================================================================
// ユーティリティ
// =============================================================================

/**
 * APIハンドラーをラップしてエラーハンドリングを統一
 * @param handler APIハンドラー関数
 * @returns ラップされたハンドラー
 */
export function withErrorHandling<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>
): (...args: T) => Promise<NextResponse<R | ApiErrorResponse>> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
