"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { SecureFetch } from "@/lib/secureFetch";

interface IntellipulseActionKey {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

export function IntellipulseActionKeyManager() {
  const t = useTranslations("account.security.intellipulseActionKeys");
  const { user } = useAuth();
  const secureFetch = new SecureFetch(user);
  const [actionKeys, setActionKeys] = useState<IntellipulseActionKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKeys, setCopiedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (user) {
      loadActionKeys();
    }
  }, [user]);

  const loadActionKeys = async () => {
    if (!user) return;

    try {
      const response = await secureFetch.fetch(
        "/api/intellipulse/action-keys",
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load action keys");
      }

      const data = await response.json();
      setActionKeys(data.data || []);
    } catch (err: any) {
      console.error("Error loading action keys:", err);
      setError(err.message || t("errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const createActionKey = async () => {
    if (!user || !newKeyName.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      const response = await secureFetch.fetch(
        "/api/intellipulse/action-keys",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: newKeyName.trim(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create action key");
      }
      const data = await response.json();

      toast.success(t("toasts.created"));
      setNewKeyName("");
      setShowCreateDialog(false);
      await loadActionKeys();

      // Show the newly created key
      setVisibleKeys(new Set([data.data.id]));
    } catch (err: any) {
      console.error("Error creating action key:", err);
      setError(err.message || t("errors.createFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  const deleteActionKey = async (keyId: string) => {
    if (!user) return;

    setIsDeleting(keyId);
    setError("");

    try {
      const response = await secureFetch.fetch(
        `/api/intellipulse/action-keys/${keyId}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to delete action key");
      }

      toast.success(t("toasts.deleted"));
      await loadActionKeys();
    } catch (err: any) {
      console.error("Error deleting action key:", err);
      setError(err.message || t("errors.deleteFailed"));
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };
  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const newCopiedKeys = new Set(copiedKeys);
      newCopiedKeys.add(keyId);
      setCopiedKeys(newCopiedKeys);

      toast.success(t("toasts.copied"));

      // Remove the copied indicator after 2 seconds
      setTimeout(() => {
        setCopiedKeys((prev) => {
          const updated = new Set(prev);
          updated.delete(keyId);
          return updated;
        });
      }, 2000);
    } catch (err) {
      toast.error(t("toasts.copyFailed"));
    }
  };

  const validateActionKey = async (keyId: string) => {
    if (!user) return;

    try {
      const response = await secureFetch.fetch(
        `/api/intellipulse/action-keys/${keyId}/validate`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to validate action key");
      }
      const data = await response.json();

      if (data.isValid) {
        toast.success(t("toasts.validationSuccess"));
      } else {
        toast.error(
          t("toasts.validationFailed", {
            reason: data.reason || t("errors.unknownReason"),
          }),
        );
      }

      // Refresh the keys to update usage statistics
      await loadActionKeys();
    } catch (err: any) {
      console.error("Error validating action key:", err);
      toast.error(err.message || t("errors.validateFailed"));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isKeyExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t("loading")}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          {" "}
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-primary" />
              <span>{t("title")}</span>
            </CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <Badge variant="outline">
            {t("keyCount", { count: actionKeys.length })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}{" "}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {t("explanatoryText")}
          </p>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t("createKey")}
              </Button>
            </DialogTrigger>{" "}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("createDialog.title")}</DialogTitle>
                <DialogDescription>
                  {t("createDialog.description")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="keyName">
                    {t("createDialog.keyNameLabel")}
                  </Label>
                  <Input
                    id="keyName"
                    placeholder={t("createDialog.keyNamePlaceholder")}
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newKeyName.trim()) {
                        createActionKey();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  {t("createDialog.cancel")}
                </Button>
                <Button
                  onClick={createActionKey}
                  disabled={!newKeyName.trim() || isCreating}
                >
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isCreating
                    ? t("createDialog.creating")
                    : t("createDialog.create")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>{" "}
        {actionKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">{t("noKeys.title")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("noKeys.description")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actionKeys.map((key) => {
              const isExpired = isKeyExpired(key.expiresAt);
              const isVisible = visibleKeys.has(key.id);
              const isCopied = copiedKeys.has(key.id);

              return (
                <div
                  key={key.id}
                  className={`border rounded-lg p-4 space-y-3 ${
                    !key.isActive || isExpired ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{key.name}</h4>{" "}
                      <div className="flex items-center space-x-1">
                        {key.isActive && !isExpired ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t("keyStatus.active")}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {isExpired
                              ? t("keyStatus.expired")
                              : t("keyStatus.inactive")}
                          </Badge>
                        )}
                      </div>
                    </div>{" "}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => validateActionKey(key.id)}
                      >
                        {t("actions.validate")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteActionKey(key.id)}
                        disabled={isDeleting === key.id}
                      >
                        {isDeleting === key.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>{" "}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label className="text-xs text-muted-foreground">
                        {t("keyDetails.keyLabel")}
                      </Label>
                      <div className="flex-1 flex items-center space-x-2">
                        <code className="flex-1 px-2 py-1 bg-muted rounded text-sm font-mono">
                          {isVisible
                            ? key.key
                            : "••••••••••••••••••••••••••••••••"}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(key.id)}
                          title={
                            isVisible ? t("actions.hide") : t("actions.show")
                          }
                        >
                          {isVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.key, key.id)}
                          title={t("actions.copy")}
                        >
                          {isCopied ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>{" "}
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium">
                          {t("keyDetails.created")}
                        </span>{" "}
                        {formatDate(key.createdAt)}
                      </div>
                      <div>
                        <span className="font-medium">
                          {t("keyDetails.usage")}
                        </span>{" "}
                        {t("keyDetails.usageTimes", { count: key.usageCount })}
                      </div>
                      {key.expiresAt && (
                        <div>
                          <span className="font-medium">
                            {t("keyDetails.expires")}
                          </span>{" "}
                          {formatDate(key.expiresAt)}
                        </div>
                      )}
                      {key.lastUsedAt && (
                        <div>
                          <span className="font-medium">
                            {t("keyDetails.lastUsed")}
                          </span>{" "}
                          {formatDate(key.lastUsedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
