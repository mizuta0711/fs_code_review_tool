"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { settingsApi, type Settings, ApiError } from "@/lib/api-client";

type AIProvider = "gemini" | "azure-openai";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("gemini");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 設定を取得
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsApi.get();
        setSettings(data);
        setSelectedProvider(data.aiProvider);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast.error("設定の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 保存
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await settingsApi.update({ aiProvider: selectedProvider });
      setSettings(updated);
      toast.success("設定を保存しました");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error(
        error instanceof ApiError ? error.message : "保存に失敗しました"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const geminiConfigured = settings?.providerStatus?.gemini?.configured ?? false;
  const azureConfigured = settings?.providerStatus?.["azure-openai"]?.configured ?? false;

  return (
    <div className="container space-y-6 max-w-2xl">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-muted-foreground">
          AIプロバイダーの設定を行います
        </p>
      </div>

      {/* AIプロバイダー選択 */}
      <Card>
        <CardHeader>
          <CardTitle>AIプロバイダー</CardTitle>
          <CardDescription>
            コードレビューに使用するAIサービスを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedProvider}
            onValueChange={(value: AIProvider) => setSelectedProvider(value)}
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="gemini" id="gemini" />
              <Label htmlFor="gemini" className="flex-1 cursor-pointer">
                <div className="font-medium">Google Gemini</div>
                <div className="text-sm text-muted-foreground">
                  Google AI Studioで取得したAPIキーを使用
                </div>
              </Label>
              <div className="flex items-center gap-2">
                {geminiConfigured ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    設定済み
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    未設定
                  </Badge>
                )}
                {selectedProvider === "gemini" && (
                  <Badge variant="default">選択中</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="azure-openai" id="azure-openai" />
              <Label htmlFor="azure-openai" className="flex-1 cursor-pointer">
                <div className="font-medium">Azure OpenAI</div>
                <div className="text-sm text-muted-foreground">
                  Azure OpenAI Serviceを使用
                </div>
              </Label>
              <div className="flex items-center gap-2">
                {azureConfigured ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    設定済み
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    未設定
                  </Badge>
                )}
                {selectedProvider === "azure-openai" && (
                  <Badge variant="default">選択中</Badge>
                )}
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 環境変数の設定案内 */}
      <Card>
        <CardHeader>
          <CardTitle>API キーの設定</CardTitle>
          <CardDescription>
            APIキーはセキュリティのため環境変数で設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium mb-2">Gemini の場合:</p>
            <pre className="text-xs text-muted-foreground">
              GEMINI_API_KEY=&quot;your-api-key&quot;
            </pre>
          </div>
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm font-medium mb-2">Azure OpenAI の場合:</p>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
{`AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_KEY="your-api-key"
AZURE_OPENAI_DEPLOYMENT="gpt-4o"`}
            </pre>
          </div>
          <p className="text-xs text-muted-foreground">
            これらの環境変数を <code>.env.local</code> ファイルに設定してください。
            設定後はアプリケーションの再起動が必要です。
          </p>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selectedProvider === "gemini" && !geminiConfigured && (
                <>
                  <XCircle className="h-4 w-4 text-yellow-600" />
                  <span>GEMINI_API_KEY が設定されていません</span>
                </>
              )}
              {selectedProvider === "azure-openai" && !azureConfigured && (
                <>
                  <XCircle className="h-4 w-4 text-yellow-600" />
                  <span>Azure OpenAI の環境変数が設定されていません</span>
                </>
              )}
              {((selectedProvider === "gemini" && geminiConfigured) ||
                (selectedProvider === "azure-openai" && azureConfigured)) && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>API設定完了</span>
                </>
              )}
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  設定を保存
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
