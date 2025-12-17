"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  CheckCircle2,
  Pencil,
  Trash2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import {
  aiProviderApi,
  type AIProviderListItem,
  type AIProviderType,
  type CreateAIProviderInput,
  type UpdateAIProviderInput,
  ApiError,
} from "@/lib/api-client";

const PROVIDER_LABELS: Record<AIProviderType, string> = {
  gemini: "Google Gemini",
  "azure-openai": "Azure OpenAI",
  claude: "Claude (Anthropic)",
};

const PROVIDER_DESCRIPTIONS: Record<AIProviderType, string> = {
  gemini: "Google AI Studioで取得したAPIキーを使用",
  "azure-openai": "Azure OpenAI Serviceを使用",
  claude: "Anthropic Claude APIを使用",
};

interface ProviderFormData {
  name: string;
  provider: AIProviderType;
  apiKey: string;
  endpoint: string;
  deployment: string;
  model: string;
  password: string;
  currentPassword: string;
}

const INITIAL_FORM_DATA: ProviderFormData = {
  name: "",
  provider: "gemini",
  apiKey: "",
  endpoint: "",
  deployment: "",
  model: "",
  password: "",
  currentPassword: "",
};

// パスワード認証が必要な操作の種類
type PasswordRequiredAction = "edit" | "delete";

export default function SettingsPage() {
  const [providers, setProviders] = useState<AIProviderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProviderListItem | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<AIProviderListItem | null>(null);
  const [formData, setFormData] = useState<ProviderFormData>(INITIAL_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActivating, setIsActivating] = useState<string | null>(null);
  const [clearPassword, setClearPassword] = useState(false);
  // パスワード認証用の状態
  const [passwordAuthTarget, setPasswordAuthTarget] = useState<AIProviderListItem | null>(null);
  const [passwordAuthAction, setPasswordAuthAction] = useState<PasswordRequiredAction | null>(null);
  const [authPassword, setAuthPassword] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // プロバイダー一覧取得
  const fetchProviders = async () => {
    try {
      const data = await aiProviderApi.list();
      setProviders(data);
    } catch (error) {
      console.error("Failed to fetch providers:", error);
      toast.error("AIプロバイダーの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // フォームダイアログを開く（新規）
  const handleOpenNewDialog = () => {
    setEditingProvider(null);
    setFormData(INITIAL_FORM_DATA);
    setClearPassword(false);
    setIsFormDialogOpen(true);
  };

  // フォームダイアログを開く（編集）
  const handleOpenEditDialog = (provider: AIProviderListItem, verifiedPassword?: string) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      provider: provider.provider,
      apiKey: "", // APIキーは表示しない
      endpoint: provider.endpoint || "",
      deployment: provider.deployment || "",
      model: provider.model || "",
      password: "", // パスワードは表示しない
      currentPassword: verifiedPassword || "", // 認証済みパスワードをセット
    });
    setClearPassword(false);
    setIsFormDialogOpen(true);
  };

  // 編集ボタンクリック時（パスワード認証チェック）
  const handleEditClick = (provider: AIProviderListItem) => {
    if (provider.hasPassword) {
      // パスワード認証が必要
      setPasswordAuthTarget(provider);
      setPasswordAuthAction("edit");
      setAuthPassword("");
      setIsPasswordDialogOpen(true);
    } else {
      // パスワード不要、直接編集ダイアログを開く
      handleOpenEditDialog(provider);
    }
  };

  // 削除ダイアログを開く
  const handleOpenDeleteDialog = (provider: AIProviderListItem, verifiedPassword?: string) => {
    setDeletingProvider(provider);
    setFormData((prev) => ({ ...prev, currentPassword: verifiedPassword || "" }));
    setIsDeleteDialogOpen(true);
  };

  // 削除ボタンクリック時（パスワード認証チェック）
  const handleDeleteClick = (provider: AIProviderListItem) => {
    if (provider.hasPassword) {
      // パスワード認証が必要
      setPasswordAuthTarget(provider);
      setPasswordAuthAction("delete");
      setAuthPassword("");
      setIsPasswordDialogOpen(true);
    } else {
      // パスワード不要、直接削除ダイアログを開く
      handleOpenDeleteDialog(provider);
    }
  };

  // パスワード認証処理
  const handlePasswordAuth = async () => {
    if (!passwordAuthTarget || !passwordAuthAction) return;

    setIsVerifyingPassword(true);
    try {
      const isValid = await aiProviderApi.verifyPassword(passwordAuthTarget.id, authPassword);
      if (!isValid) {
        toast.error("パスワードが正しくありません");
        return;
      }

      setIsPasswordDialogOpen(false);

      // 認証成功後、該当の操作を実行
      if (passwordAuthAction === "edit") {
        handleOpenEditDialog(passwordAuthTarget, authPassword);
      } else if (passwordAuthAction === "delete") {
        handleOpenDeleteDialog(passwordAuthTarget, authPassword);
      }
    } catch (error) {
      console.error("Password verification failed:", error);
      toast.error("パスワードの検証に失敗しました");
    } finally {
      setIsVerifyingPassword(false);
      setPasswordAuthTarget(null);
      setPasswordAuthAction(null);
      setAuthPassword("");
    }
  };

  // 保存処理
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("表示名を入力してください");
      return;
    }

    if (!editingProvider) {
      // 新規作成時の必須チェック
      if (!formData.apiKey) {
        toast.error("APIキーを入力してください");
        return;
      }
      // パスワードは任意だが、設定する場合は4文字以上
      if (formData.password && formData.password.length < 4) {
        toast.error("パスワードは4文字以上で入力してください");
        return;
      }

      // Azure OpenAIの場合はendpointとdeploymentが必須
      if (formData.provider === "azure-openai") {
        if (!formData.endpoint) {
          toast.error("エンドポイントを入力してください");
          return;
        }
        if (!formData.deployment) {
          toast.error("デプロイメント名を入力してください");
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      if (editingProvider) {
        // 更新
        const updateData: UpdateAIProviderInput = {
          name: formData.name,
          provider: formData.provider,
          endpoint: formData.endpoint || undefined,
          deployment: formData.deployment || undefined,
          model: formData.model || undefined,
        };
        if (formData.apiKey) {
          updateData.apiKey = formData.apiKey;
        }
        // パスワード削除の場合は空文字列を送信、新しいパスワードがあればそれを送信
        if (clearPassword) {
          updateData.password = "";
        } else if (formData.password) {
          updateData.password = formData.password;
        }
        // パスワード付きプロバイダーの場合は現在のパスワードを送信
        if (formData.currentPassword) {
          updateData.currentPassword = formData.currentPassword;
        }
        await aiProviderApi.update(editingProvider.id, updateData);
        toast.success("AIプロバイダーを更新しました");
      } else {
        // 新規作成
        const createData: CreateAIProviderInput = {
          name: formData.name,
          provider: formData.provider,
          apiKey: formData.apiKey,
          endpoint: formData.endpoint || undefined,
          deployment: formData.deployment || undefined,
          model: formData.model || undefined,
          password: formData.password,
        };
        await aiProviderApi.create(createData);
        toast.success("AIプロバイダーを登録しました");
      }
      setIsFormDialogOpen(false);
      fetchProviders();
    } catch (error) {
      console.error("Failed to save provider:", error);
      toast.error(
        error instanceof ApiError ? error.message : "保存に失敗しました"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!deletingProvider) return;

    setIsDeleting(true);
    try {
      // パスワード付きプロバイダーの場合はパスワードを渡す
      const password = deletingProvider.hasPassword ? formData.currentPassword : undefined;
      await aiProviderApi.delete(deletingProvider.id, password);
      toast.success("AIプロバイダーを削除しました");
      setIsDeleteDialogOpen(false);
      setDeletingProvider(null);
      setFormData((prev) => ({ ...prev, currentPassword: "" }));
      fetchProviders();
    } catch (error) {
      console.error("Failed to delete provider:", error);
      toast.error(
        error instanceof ApiError ? error.message : "削除に失敗しました"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // アクティブ化処理
  const handleActivate = async (id: string) => {
    setIsActivating(id);
    try {
      await aiProviderApi.activate(id);
      toast.success("デフォルトプロバイダーを設定しました");
      fetchProviders();
    } catch (error) {
      console.error("Failed to activate provider:", error);
      toast.error(
        error instanceof ApiError ? error.message : "デフォルト設定に失敗しました"
      );
    } finally {
      setIsActivating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeProvider = providers.find((p) => p.isActive);

  return (
    <div className="container space-y-6 max-w-3xl">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AIプロバイダー設定</h1>
          <p className="text-muted-foreground">
            コードレビューに使用するAIプロバイダーを管理します
          </p>
        </div>
        <Button onClick={handleOpenNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          新規登録
        </Button>
      </div>

      {/* デフォルトプロバイダー */}
      {activeProvider && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              デフォルトプロバイダー
            </CardTitle>
            <CardDescription className="text-xs">
              レビュー画面で初期選択されるプロバイダーです
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="font-medium">{activeProvider.name}</span>
              <Badge variant="outline">
                {PROVIDER_LABELS[activeProvider.provider]}
              </Badge>
              {activeProvider.model && (
                <span className="text-sm text-muted-foreground">
                  モデル: {activeProvider.model}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {providers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">
              AIプロバイダーが登録されていません
            </p>
            <Button onClick={handleOpenNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              最初のプロバイダーを登録
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>登録済みプロバイダー</CardTitle>
            <CardDescription>
              「デフォルトに設定」でデフォルトプロバイダーを選択できます。レビュー時に個別選択も可能です。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    provider.isActive
                      ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {provider.isActive && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{provider.name}</span>
                        <Badge variant="secondary">
                          {PROVIDER_LABELS[provider.provider]}
                        </Badge>
                        {!provider.hasPassword && (
                          <Badge variant="outline" className="text-xs">
                            パスワード無し
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {provider.model && <span>モデル: {provider.model}</span>}
                        {provider.endpoint && (
                          <span className="ml-2">
                            エンドポイント: {provider.endpoint}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!provider.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivate(provider.id)}
                        disabled={isActivating === provider.id}
                      >
                        {isActivating === provider.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        デフォルトに設定
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(provider)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(provider)}
                      disabled={provider.isActive}
                      title={
                        provider.isActive
                          ? "デフォルトプロバイダーは削除できません"
                          : "削除"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 登録/編集ダイアログ */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProvider
                ? "AIプロバイダーを編集"
                : "AIプロバイダーを登録"}
            </DialogTitle>
            <DialogDescription>
              {editingProvider
                ? "設定を変更してください。APIキーとパスワードは空欄の場合変更されません。"
                : "新しいAIプロバイダーの設定を入力してください。"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">表示名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="例: 本番用Gemini"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">プロバイダー *</Label>
              <Select
                value={formData.provider}
                onValueChange={(value: AIProviderType) =>
                  setFormData((prev) => ({ ...prev, provider: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROVIDER_LABELS) as AIProviderType[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        <div>
                          <div>{PROVIDER_LABELS[key]}</div>
                          <div className="text-xs text-muted-foreground">
                            {PROVIDER_DESCRIPTIONS[key]}
                          </div>
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                APIキー {editingProvider ? "(変更する場合のみ)" : "*"}
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder={editingProvider ? "変更しない場合は空欄" : "APIキーを入力"}
              />
            </div>
            {formData.provider === "azure-openai" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="endpoint">エンドポイント *</Label>
                  <Input
                    id="endpoint"
                    value={formData.endpoint}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endpoint: e.target.value,
                      }))
                    }
                    placeholder="https://your-resource.openai.azure.com/"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deployment">デプロイメント名 *</Label>
                  <Input
                    id="deployment"
                    value={formData.deployment}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        deployment: e.target.value,
                      }))
                    }
                    placeholder="gpt-4o"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="model">モデル名（任意）</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, model: e.target.value }))
                }
                placeholder={
                  formData.provider === "gemini"
                    ? "gemini-1.5-flash"
                    : formData.provider === "claude"
                    ? "claude-3-5-sonnet-20241022"
                    : ""
                }
              />
              <p className="text-xs text-muted-foreground">
                空欄の場合はデフォルトモデルが使用されます
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                利用パスワード (任意)
              </Label>
              {editingProvider?.hasPassword && (
                <div className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id="clearPassword"
                    checked={clearPassword}
                    onCheckedChange={(checked) => {
                      setClearPassword(checked === true);
                      if (checked) {
                        setFormData((prev) => ({ ...prev, password: "" }));
                      }
                    }}
                  />
                  <label
                    htmlFor="clearPassword"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    パスワードを削除する
                  </label>
                </div>
              )}
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                placeholder={
                  editingProvider
                    ? clearPassword
                      ? "パスワードは削除されます"
                      : "変更しない場合は空欄"
                    : "4文字以上（空欄可）"
                }
                disabled={clearPassword}
              />
              <p className="text-xs text-muted-foreground">
                設定するとレビュー時に入力が必要になります
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFormDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingProvider ? "更新" : "登録"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              削除の確認
            </DialogTitle>
            <DialogDescription>
              「{deletingProvider?.name}」を削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* パスワード認証ダイアログ */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              パスワード認証
            </DialogTitle>
            <DialogDescription>
              「{passwordAuthTarget?.name}」を
              {passwordAuthAction === "edit" ? "編集" : "削除"}
              するには、利用パスワードを入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="authPassword">パスワード</Label>
            <Input
              id="authPassword"
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="利用パスワードを入力"
              onKeyDown={(e) => {
                if (e.key === "Enter" && authPassword) {
                  handlePasswordAuth();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setPasswordAuthTarget(null);
                setPasswordAuthAction(null);
                setAuthPassword("");
              }}
            >
              キャンセル
            </Button>
            <Button
              onClick={handlePasswordAuth}
              disabled={!authPassword || isVerifyingPassword}
            >
              {isVerifyingPassword && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              認証
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
