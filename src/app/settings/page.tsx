"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Save,
  TestTube,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

type AIProvider = "gemini" | "azure";

interface Settings {
  provider: AIProvider;
  gemini: {
    apiKey: string;
  };
  azure: {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    provider: "gemini",
    gemini: {
      apiKey: "",
    },
    azure: {
      endpoint: "",
      apiKey: "",
      deploymentName: "",
    },
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showAzureKey, setShowAzureKey] = useState(false);

  // 接続テスト（モック）
  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    // モックのテスト結果（1.5秒後に表示）
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // APIキーが設定されていればsuccess、なければerror
    const isValid =
      settings.provider === "gemini"
        ? settings.gemini.apiKey.length > 0
        : settings.azure.endpoint.length > 0 && settings.azure.apiKey.length > 0;

    setTestResult(isValid ? "success" : "error");
    setIsTesting(false);

    if (isValid) {
      toast.success("接続テスト成功", {
        description: "AIサービスへの接続が確認できました",
      });
    } else {
      toast.error("接続テスト失敗", {
        description: "必要な設定項目を入力してください",
      });
    }
  };

  // 保存（モック）
  const handleSave = () => {
    toast.success("設定を保存しました", {
      description: "AI設定が正常に保存されました",
    });
  };

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
            value={settings.provider}
            onValueChange={(value: AIProvider) =>
              setSettings({ ...settings, provider: value })
            }
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
              {settings.provider === "gemini" && (
                <Badge variant="default">選択中</Badge>
              )}
            </div>
            <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
              <RadioGroupItem value="azure" id="azure" />
              <Label htmlFor="azure" className="flex-1 cursor-pointer">
                <div className="font-medium">Azure OpenAI</div>
                <div className="text-sm text-muted-foreground">
                  Azure OpenAI Serviceを使用
                </div>
              </Label>
              {settings.provider === "azure" && (
                <Badge variant="default">選択中</Badge>
              )}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Gemini設定 */}
      {settings.provider === "gemini" && (
        <Card>
          <CardHeader>
            <CardTitle>Gemini設定</CardTitle>
            <CardDescription>
              Google AI StudioからAPIキーを取得して設定してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">APIキー</Label>
              <div className="relative">
                <Input
                  id="gemini-api-key"
                  type={showGeminiKey ? "text" : "password"}
                  value={settings.gemini.apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      gemini: { ...settings.gemini, apiKey: e.target.value },
                    })
                  }
                  placeholder="AIza..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                >
                  {showGeminiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
                でAPIキーを取得できます
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Azure OpenAI設定 */}
      {settings.provider === "azure" && (
        <Card>
          <CardHeader>
            <CardTitle>Azure OpenAI設定</CardTitle>
            <CardDescription>
              Azureポータルから取得した情報を設定してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="azure-endpoint">エンドポイント</Label>
              <Input
                id="azure-endpoint"
                type="text"
                value={settings.azure.endpoint}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    azure: { ...settings.azure, endpoint: e.target.value },
                  })
                }
                placeholder="https://your-resource.openai.azure.com/"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="azure-api-key">APIキー</Label>
              <div className="relative">
                <Input
                  id="azure-api-key"
                  type={showAzureKey ? "text" : "password"}
                  value={settings.azure.apiKey}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      azure: { ...settings.azure, apiKey: e.target.value },
                    })
                  }
                  placeholder="••••••••••••••••"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowAzureKey(!showAzureKey)}
                >
                  {showAzureKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="azure-deployment">デプロイメント名</Label>
              <Input
                id="azure-deployment"
                type="text"
                value={settings.azure.deploymentName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    azure: { ...settings.azure, deploymentName: e.target.value },
                  })
                }
                placeholder="gpt-4o"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 接続テストと保存 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    テスト中...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    接続テスト
                  </>
                )}
              </Button>
              {testResult === "success" && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm">接続成功</span>
                </div>
              )}
              {testResult === "error" && (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">接続失敗</span>
                </div>
              )}
            </div>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              設定を保存
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
