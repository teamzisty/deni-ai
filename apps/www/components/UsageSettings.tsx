"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { Badge } from "@workspace/ui/components/badge";
import { Zap, BarChart3, Clock } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { getModelDisplayName } from "@/lib/usage-client";

interface UsageInfo {
  model: string;
  displayName: string;
  count: number;
  limit: number;
  isPremium: boolean;
  canUse: boolean;
  remaining: number;
}

interface UsageStats {
  model: string;
  count: number;
  date: string;
}

export default function UsageSettings() {
  const t = useTranslations();
  const { user, supabase } = useAuth();
  const [usage, setUsage] = useState<UsageInfo[]>([]);
  const [stats, setStats] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllModels, setShowAllModels] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const fetchUsage = async (forceRefresh: boolean = false, clearCache?: boolean) => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("認証が必要です");
        return;
      } // Fetch current usage (optimized based on showAllModels setting)
      const usageResponse = await fetch(
        `/api/uses?onlyUsed=${!showAllModels}&forceRefresh=${clearCache || false}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (!usageResponse.ok) {
        throw new Error(`Usage API error: ${usageResponse.status}`);
      }

      const usageData = await usageResponse.json();
      setUsage(usageData.usage || []);

      // Fetch usage stats
      const statsResponse = await fetch("/api/uses?type=stats&days=7", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || []);
      }
    } catch (err) {
      console.error("Failed to fetch usage data:", err);
      setError(
        err instanceof Error ? err.message : "使用データの取得に失敗しました",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    fetchUsage();
  }, [user, supabase, showAllModels]);

  const getTotalUsageToday = () => {
    const today = new Date().toISOString().split("T")[0];
    return stats
      .filter((stat) => stat.date === today)
      .reduce((total, stat) => total + stat.count, 0);
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("settings.usage.title", { default: "使用状況" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t("settings.usage.loginRequired", {
                default: "使用状況を確認するにはログインが必要です",
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("settings.usage.title", { default: "使用状況" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t("settings.usage.loading", {
                default: "使用状況を読み込み中...",
              })}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t("settings.usage.title", { default: "使用状況" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {" "}
            <div className="space-y-4">
              <p className="text-destructive">{error}</p>
              <Button
                onClick={() => fetchUsage(true, true)}
                variant="outline"
                disabled={refreshing}
              >
                {refreshing
                  ? t("settings.usage.refreshing", { default: "更新中..." })
                  : t("settings.usage.retry", { default: "再試行" })}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("settings.usage.title", { default: "使用状況" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{getTotalUsageToday()}</div>
              <div className="text-sm text-muted-foreground">
                {t("settings.usage.todayTotal", { default: "今日の合計" })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {usage.filter((u) => u.isPremium).length}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("settings.usage.premiumModels", {
                  default: "プレミアムモデル",
                })}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {usage.filter((u) => !u.isPremium).length}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("settings.usage.basicModels", {
                  default: "ベーシックモデル",
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>{" "}
      {/* Model Usage Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              {t("settings.usage.modelUsage", { default: "モデル別使用状況" })}
            </div>{" "}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllModels(!showAllModels)}
              >
                {showAllModels
                  ? t("settings.usage.showUsedOnly", { default: "使用中のみ" })
                  : t("settings.usage.showAllModels", { default: "全モデル" })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsage(true, true)}
                disabled={refreshing}
              >
                {refreshing
                  ? t("settings.usage.refreshing", { default: "更新中..." })
                  : t("settings.usage.refresh", { default: "更新" })}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {usage.map((modelUsage) => (
              <div key={modelUsage.model} className="space-y-2">
                {" "}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {modelUsage.displayName}
                    </span>
                    {modelUsage.isPremium && (
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {t("settings.usage.premium", { default: "プレミアム" })}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {modelUsage.limit === -1 ? (
                      <span>
                        {t("settings.usage.unlimited", { default: "無制限" })}
                      </span>
                    ) : (
                      <span>
                        {modelUsage.count} / {modelUsage.limit}
                      </span>
                    )}
                  </div>
                </div>
                {modelUsage.limit > 0 && (
                  <div className="space-y-1">
                    <Progress
                      value={(modelUsage.count / modelUsage.limit) * 100}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {t("settings.usage.used", { default: "使用済み" })}:{" "}
                        {modelUsage.count}
                      </span>
                      <span>
                        {t("settings.usage.remaining", { default: "残り" })}:{" "}
                        {modelUsage.remaining}
                      </span>
                    </div>
                  </div>
                )}
                {!modelUsage.canUse && (
                  <div className="text-sm text-destructive">
                    {t("settings.usage.limitExceeded", {
                      default: "使用制限に達しました",
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Recent Usage Stats */}
      {stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t("settings.usage.recentActivity", {
                default: "最近の使用履歴",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .slice(0, 7)
                .map((stat, index) => (
                  <div
                    key={`${stat.model}-${stat.date}`}
                    className="flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {getModelDisplayName(stat.model)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(stat.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{stat.count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
