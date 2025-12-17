# FSCodeReviewTool 改善計画

## 概要

本ドキュメントは、FSCodeReviewToolの次期改善計画をまとめたものです。

### 改善項目一覧

| # | 改善項目 | 優先度 | 影響範囲 |
|---|----------|--------|----------|
| 1 | PostgreSQL (Neon) への移行 | 高 | DB層全体 |
| 2 | AIのAPIキー複数登録・切り替え機能 | 高 | DB, API, UI |
| 3 | Claude Sonnet API対応 | 中 | AI層 |
| 4 | ファイルタブUIの改善 | 中 | フロントエンド |
| 5 | プロンプト削除確認ダイアログ | 低 | フロントエンド |

---

## 1. PostgreSQL (Neon) への移行

### 1.1 現状
- **データベース**: SQLite (`prisma/dev.db`)
- **接続設定**: `datasource db { provider = "sqlite", url = "file:./dev.db" }`

### 1.2 変更内容

#### Prismaスキーマの変更
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 環境変数の追加
```env
# Neon PostgreSQL接続文字列
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

### 1.3 マイグレーション手順

1. **Neonプロジェクト作成**
   - Neon Console (https://console.neon.tech) でプロジェクト作成
   - 接続文字列を取得

2. **Prismaスキーマ更新**
   ```bash
   # schema.prismaのproviderをpostgresqlに変更後
   npx prisma generate
   npx prisma db push
   ```

3. **データ移行（必要な場合）**
   - 既存SQLiteデータのエクスポート
   - PostgreSQLへのインポート

### 1.4 影響ファイル
- `prisma/schema.prisma`
- `.env` / `.env.example`
- `src/lib/prisma.ts`（変更不要、Prisma Clientが自動対応）

### 1.5 注意事項
- SQLiteとPostgreSQLの構文差異（特に文字列関数、日時関数）
- Neonのコネクションプーリング設定
- プロダクション環境でのSSL接続必須

---

## 2. AIのAPIキー複数登録・切り替え機能

### 2.1 現状
- APIキーは環境変数で単一設定のみ
- 切り替えはコード変更が必要
- 認証機能なし

### 2.2 要件
- 複数人での利用を想定
- 本格的なログイン機能は不要
- **簡易パスワード認証**: AIプロバイダーごとにパスワードを設定し、レビュー時に認証
- 入力済みパスワードはクライアント（localStorage）に保存して再入力不要に

### 2.3 設計

#### データベーススキーマ
```prisma
/// AIプロバイダー設定
model AIProviderConfig {
  id          String   @id @default(uuid())
  name        String               // 表示名（例: "本番用Gemini", "テスト用Claude"）
  provider    String               // プロバイダー種別: gemini, azure-openai, claude
  apiKey      String               // 暗号化されたAPIキー
  endpoint    String?              // Azure OpenAI用エンドポイント
  deployment  String?              // Azure OpenAI用デプロイメント名
  model       String?              // モデル名（オプション）
  password    String               // 利用パスワード（ハッシュ化）
  isActive    Boolean  @default(false)  // 現在使用中かどうか
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([provider])
  @@index([isActive])
}

/// アプリケーション設定（既存を拡張）
model Setting {
  id                    String   @id @default("default")
  activeProviderId      String?  // 現在アクティブなAIProviderConfigのID
  updatedAt             DateTime @updatedAt
}
```

#### APIエンドポイント設計
```
# プロバイダー管理（管理者向け）
GET    /api/ai-providers           # プロバイダー設定一覧取得（パスワード除く）
POST   /api/ai-providers           # プロバイダー設定作成
GET    /api/ai-providers/:id       # プロバイダー設定詳細取得
PUT    /api/ai-providers/:id       # プロバイダー設定更新
DELETE /api/ai-providers/:id       # プロバイダー設定削除
PUT    /api/ai-providers/:id/activate  # プロバイダーをアクティブ化

# レビューAPI（パスワード認証）
POST   /api/review                 # リクエストbodyにpasswordを含める
```

#### パスワード認証フロー
```
┌─────────────────────────────────────────────────────────────────┐
│ 1. ユーザーがレビュー実行をクリック                             │
│                                                                 │
│ 2. クライアント側でlocalStorageからパスワードを取得             │
│    - キー: `ai_provider_password_${providerId}`                 │
│    - 保存済み → 3へ                                            │
│    - 未保存 → パスワード入力ダイアログ表示                      │
│                                                                 │
│ 3. レビューAPIにパスワードを含めてリクエスト                    │
│    POST /api/review { files, promptId, password }               │
│                                                                 │
│ 4. サーバー側でパスワード検証                                   │
│    - OK → レビュー実行                                         │
│    - NG → 401エラー（クライアントはlocalStorage削除→再入力）   │
└─────────────────────────────────────────────────────────────────┘
```

#### 暗号化・ハッシュユーティリティ
```typescript
// src/lib/crypto.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32バイトの秘密鍵
const IV_LENGTH = 16;

// APIキーの暗号化（復号可能）
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// パスワードのハッシュ化（復号不可）
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
```

### 2.4 UI設計

#### 設定画面（管理者向け）
```
設定 > AIプロバイダー管理
┌─────────────────────────────────────────────────────┐
│ [+ 新規追加]                                        │
├─────────────────────────────────────────────────────┤
│ ◉ 本番用 Gemini                      [編集] [削除] │
│   プロバイダー: Gemini                              │
│   モデル: gemini-1.5-pro                           │
│   パスワード: 設定済み ✓                           │
│   作成日: 2024/01/15                               │
├─────────────────────────────────────────────────────┤
│ ○ テスト用 Claude                    [編集] [削除] │
│   プロバイダー: Claude                              │
│   モデル: claude-sonnet-4-20250514                 │
│   パスワード: 設定済み ✓                           │
│   作成日: 2024/01/20                               │
└─────────────────────────────────────────────────────┘
```

#### プロバイダー登録・編集フォーム
```
┌─────────────────────────────────────────────────────┐
│ AIプロバイダー設定                                  │
├─────────────────────────────────────────────────────┤
│ 表示名:     [本番用 Gemini          ]              │
│ プロバイダー: [Gemini ▼]                           │
│ APIキー:    [••••••••••••••••••••••]              │
│ モデル:     [gemini-1.5-pro        ] (任意)        │
│                                                     │
│ ─── 利用パスワード ───                             │
│ パスワード: [••••••••              ]              │
│ ※ レビュー実行時に必要です                         │
│                                                     │
│            [キャンセル] [保存]                      │
└─────────────────────────────────────────────────────┘
```

#### パスワード入力ダイアログ（レビュー時）
```
┌─────────────────────────────────────────────────────┐
│ パスワード認証                                      │
├─────────────────────────────────────────────────────┤
│ 「本番用 Gemini」を使用するにはパスワードが         │
│ 必要です。                                          │
│                                                     │
│ パスワード: [••••••••              ]              │
│                                                     │
│ ☑ このブラウザで記憶する                           │
│                                                     │
│            [キャンセル] [認証]                      │
└─────────────────────────────────────────────────────┘
```

### 2.5 クライアント側パスワード管理
```typescript
// src/lib/auth-storage.ts
const STORAGE_KEY_PREFIX = 'ai_provider_password_';

export function getStoredPassword(providerId: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${providerId}`);
}

export function storePassword(providerId: string, password: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${providerId}`, password);
}

export function clearPassword(providerId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${providerId}`);
}

export function clearAllPasswords(): void {
  if (typeof window === 'undefined') return;
  Object.keys(localStorage)
    .filter(key => key.startsWith(STORAGE_KEY_PREFIX))
    .forEach(key => localStorage.removeItem(key));
}
```

### 2.6 ディレクトリ構成
```
src/
├── features/
│   └── ai-provider/
│       ├── repositories/
│       │   └── aiProviderRepository.server.ts
│       ├── services/
│       │   └── aiProviderService.server.ts
│       └── components/
│           ├── AIProviderList.tsx
│           ├── AIProviderForm.tsx
│           ├── AIProviderCard.tsx
│           └── PasswordDialog.tsx      # パスワード入力ダイアログ
├── lib/
│   ├── crypto.ts                       # 暗号化・ハッシュユーティリティ
│   └── auth-storage.ts                 # クライアント側パスワード管理
└── app/
    └── api/
        └── ai-providers/
            ├── route.ts                # GET, POST
            └── [id]/
                ├── route.ts            # GET, PUT, DELETE
                └── activate/
                    └── route.ts        # PUT
```

### 2.7 環境変数
```env
# 既存の環境変数は移行期間中のフォールバックとして維持
GEMINI_API_KEY=xxx           # フォールバック用
AZURE_OPENAI_API_KEY=xxx     # フォールバック用

# 新規追加
ENCRYPTION_KEY=xxx           # APIキー暗号化用（32バイト16進数）
```

### 2.8 セキュリティ考慮事項
| 項目 | 対策 |
|------|------|
| APIキー保護 | AES-256暗号化でDB保存 |
| パスワード保護 | SHA-256ハッシュ化でDB保存（平文保存しない） |
| クライアント保存 | localStorage使用（平文だが、ブラウザ内のみ） |
| 通信経路 | HTTPS必須（本番環境） |
| ブルートフォース | 今回は対策なし（必要なら将来追加） |

---

## 3. Claude Sonnet API対応

### 3.1 現状
- 対応プロバイダー: `gemini`, `azure-openai`
- AIProvider型: `type AIProvider = "gemini" | "azure-openai"`

### 3.2 変更内容

#### 型定義の拡張
```typescript
// src/lib/ai/types.ts
export type AIProvider = "gemini" | "azure-openai" | "claude";
```

#### 定数の更新
```typescript
// src/lib/constants.ts
export const AI_PROVIDERS = {
  GEMINI: "gemini",
  AZURE_OPENAI: "azure-openai",
  CLAUDE: "claude",
} as const;
```

#### Claudeクライアント実装
```typescript
// src/lib/ai/claude.ts
import Anthropic from "@anthropic-ai/sdk";
import type { LanguageModelClient, ReviewRequest, ReviewResponse } from "./types";

export class ClaudeClient implements LanguageModelClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("Anthropic API key is not configured");
    }
    this.client = new Anthropic({ apiKey: key });
    this.model = model || process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
  }

  async review(request: ReviewRequest): Promise<ReviewResponse> {
    const reviewedFiles = await Promise.all(
      request.files.map(async (file) => {
        const message = await this.client.messages.create({
          model: this.model,
          max_tokens: 8192,
          messages: [
            {
              role: "user",
              content: this.buildPrompt(
                request.prompt,
                file.name,
                file.language,
                file.content
              ),
            },
          ],
        });

        const content = message.content[0];
        const reviewedContent = content.type === "text" ? content.text : "";

        return {
          name: file.name,
          language: file.language,
          content: this.extractCode(reviewedContent),
        };
      })
    );

    return { reviewedFiles };
  }

  private buildPrompt(
    systemPrompt: string,
    fileName: string,
    language: string,
    code: string
  ): string {
    return `${systemPrompt}

---

ファイル名: ${fileName}
言語: ${language}

\`\`\`${language}
${code}
\`\`\``;
  }

  private extractCode(response: string): string {
    const codeBlockMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    return response.trim();
  }
}
```

#### ファクトリの更新
```typescript
// src/lib/ai/factory.ts
import { ClaudeClient } from "./claude";

export function createAIClient(
  provider: AIProvider,
  config?: { apiKey?: string; model?: string; endpoint?: string; deployment?: string }
): LanguageModelClient {
  switch (provider) {
    case "gemini":
      return new GeminiClient(config?.apiKey, config?.model);
    case "azure-openai":
      return new AzureOpenAIClient(config?.apiKey, config?.endpoint, config?.deployment);
    case "claude":
      return new ClaudeClient(config?.apiKey, config?.model);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
```

### 3.3 依存パッケージ
```bash
npm install @anthropic-ai/sdk
```

---

## 4. ファイルタブUIの改善

### 4.1 現状の問題
- ファイル名入力フィールドがタブ全体を覆っており、タブクリックがファイル名編集モードになる
- タブ切り替えが意図せずファイル名編集になることがある
- 操作の優先度: タブ切り替え >> ファイル名変更

### 4.2 改善案

#### 案A: ダブルクリック編集方式（推奨）
- **シングルクリック**: タブ切り替え
- **ダブルクリック**: ファイル名編集モード開始
- **クリック外 or Enter**: 編集確定
- **Escape**: 編集キャンセル

```tsx
// 改善後のタブコンポーネント
interface FileTabProps {
  file: CodeFile;
  isActive: boolean;
  onSelect: () => void;
  onRename: (newName: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function FileTab({ file, isActive, onSelect, onRename, onRemove, canRemove }: FileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(file.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(file.name);
  };

  const handleConfirm = () => {
    if (editValue.trim()) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      setEditValue(file.name);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-3 py-2 cursor-pointer transition-colors border-b-2 -mb-[2px]",
        isActive
          ? "border-primary bg-background"
          : "border-transparent hover:bg-muted/50"
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleConfirm}
          onKeyDown={handleKeyDown}
          className="h-5 w-28 text-xs p-1"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm truncate max-w-[100px]" title={file.name}>
          {file.name}
        </span>
      )}
      {canRemove && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted-foreground hover:text-foreground ml-1 opacity-0 group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
```

#### UI改善ポイント
1. **視覚的フィードバック**: ホバー時に編集可能であることを示すアイコン表示
2. **ツールチップ**: 「ダブルクリックで名前変更」のヒント表示
3. **削除ボタン**: ホバー時のみ表示（タブをすっきり保つ）
4. **長いファイル名**: truncateで省略、ホバーでフル表示

### 4.3 追加の改善案
- タブのドラッグ&ドロップ並び替え（オプション）
- タブのコンテキストメニュー（右クリック）
- キーボードショートカット（Ctrl+Tab でタブ切り替え）

---

## 5. プロンプト削除確認ダイアログ

### 5.1 現状
- 削除ボタンクリックで即座に削除実行
- 誤操作時のリカバリー不可

### 5.2 実装

#### 確認ダイアログコンポーネント
```tsx
// src/components/ui/confirm-dialog.tsx（または既存のAlertDialogを使用）
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isDeleting,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                削除中...
              </>
            ) : (
              "削除"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

#### プロンプト画面への適用
```tsx
// src/app/prompts/page.tsx の変更点
const [deleteTarget, setDeleteTarget] = useState<Prompt | null>(null);
const [isDeleting, setIsDeleting] = useState(false);

const handleDeleteClick = (prompt: Prompt) => {
  setDeleteTarget(prompt);
};

const handleDeleteConfirm = async () => {
  if (!deleteTarget) return;

  setIsDeleting(true);
  try {
    await promptsApi.delete(deleteTarget.id);
    setPrompts(prompts.filter((p) => p.id !== deleteTarget.id));
    toast.success("プロンプトを削除しました");
    setDeleteTarget(null);
  } catch (error) {
    toast.error("削除に失敗しました");
  } finally {
    setIsDeleting(false);
  }
};

// JSX内
<ConfirmDeleteDialog
  open={!!deleteTarget}
  onOpenChange={(open) => !open && setDeleteTarget(null)}
  title="プロンプトを削除"
  description={`「${deleteTarget?.name}」を削除してもよろしいですか？この操作は取り消せません。`}
  onConfirm={handleDeleteConfirm}
  isDeleting={isDeleting}
/>
```

---

## 6. 実装優先順位・フェーズ分け

### Phase 1: 基盤整備（必須・先行実装）
| # | タスク | 工数目安 |
|---|--------|----------|
| 1-1 | PostgreSQL (Neon) への移行 | 2h |
| 5-1 | プロンプト削除確認ダイアログ | 1h |

### Phase 2: AI機能拡張
| # | タスク | 工数目安 |
|---|--------|----------|
| 3-1 | Claude Sonnet API対応 | 2h |
| 2-1 | AIProviderConfigスキーマ追加 | 1h |
| 2-2 | 暗号化ユーティリティ実装 | 1h |
| 2-3 | APIキー管理API実装 | 3h |
| 2-4 | APIキー管理UI実装 | 3h |
| 2-5 | AIクライアントファクトリの改修 | 2h |

### Phase 3: UI/UX改善
| # | タスク | 工数目安 |
|---|--------|----------|
| 4-1 | FileTabコンポーネント分離 | 1h |
| 4-2 | ダブルクリック編集方式実装 | 2h |
| 4-3 | 視覚的フィードバック追加 | 1h |

---

## 7. 依存パッケージの追加

```bash
# Claude API対応
npm install @anthropic-ai/sdk

# shadcn/ui AlertDialog（未追加の場合）
npx shadcn@latest add alert-dialog
```

---

## 8. 環境変数一覧（最終形）

```env
# データベース
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# 暗号化キー（APIキー暗号化用）
ENCRYPTION_KEY="your-32-byte-hex-key"

# フォールバック用（移行期間中のみ使用）
GEMINI_API_KEY="xxx"
AZURE_OPENAI_ENDPOINT="xxx"
AZURE_OPENAI_API_KEY="xxx"
AZURE_OPENAI_DEPLOYMENT="xxx"
ANTHROPIC_API_KEY="xxx"
```

---

## 9. 移行時の注意事項

### データ移行
1. 既存のSQLiteデータをエクスポート
2. PostgreSQLへインポート
3. 環境変数の設定確認

### 互換性確保
1. 環境変数によるAPIキー設定は移行期間中フォールバックとして維持
2. データベースに設定がない場合は環境変数を使用

### ロールバック計画
1. SQLiteファイルのバックアップ保持
2. Prismaスキーマの切り替え対応
