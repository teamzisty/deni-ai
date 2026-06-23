"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  Download,
  History,
  Mail,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useExtracted } from "next-intl";
import { startTransition, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanHighlights } from "@/components/billing/plan-highlights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsPageShell } from "@/components/settings-page-shell";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";
import { useBillingPlanCopy } from "@/lib/billing-plan-copy";
import { formatMinorCurrency } from "@/lib/currency";
import { trpc } from "@/lib/trpc/react";

type Organization = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  createdAt: Date;
};

type Member = {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

type Invitation = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
};

function isMember(value: unknown): value is Member {
  if (!value || typeof value !== "object") {
    return false;
  }

  const member = value as Partial<Member>;
  return (
    typeof member.id === "string" &&
    typeof member.userId === "string" &&
    typeof member.role === "string" &&
    !!member.user &&
    typeof member.user === "object" &&
    typeof member.user.id === "string" &&
    typeof member.user.email === "string"
  );
}

function isInvitation(value: unknown): value is Invitation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const invitation = value as Partial<Invitation>;
  return (
    typeof invitation.id === "string" &&
    typeof invitation.email === "string" &&
    typeof invitation.status === "string"
  );
}

function formatCurrency(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "—";
  return formatMinorCurrency(amount, currency, {
    currencyDisplay: "code",
    minimumFractionDigits: 0,
  });
}

const numberFormatter = new Intl.NumberFormat(undefined);

const monthDayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
});

const monthDayYearFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatTokenLimit(value: number | null) {
  if (value === null) return "";
  return numberFormatter.format(value);
}

function parseTokenLimit(value: string) {
  const normalized = value.replace(/[,_\s]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
}

function escapeCsvCell(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function TeamSettingsContent() {
  const t = useExtracted();
  const { push } = useRouter();
  const session = authClient.useSession();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  // Create org dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  // Invite dialog
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [isInviting, setIsInviting] = useState(false);

  // Remove member dialog
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const currentUserId = session.data?.user?.id ?? null;

  const { data: organizationsData, isLoading: organizationsLoading } = useQuery({
    queryKey: ["team", "organizations", currentUserId],
    enabled: !session.isPending,
    queryFn: async () => {
      const result = await authClient.organization.list({});
      return (result.data ?? []) as Organization[];
    },
  });
  const { data: orgDetailsData } = useQuery({
    queryKey: ["team", "organization", currentUserId, activeOrg?.id],
    enabled: Boolean(activeOrg?.id),
    queryFn: async () => {
      const result = await authClient.organization.getFullOrganization({
        query: { organizationId: activeOrg?.id ?? "" },
      });
      return result.data ?? null;
    },
  });
  const monthlyPlanCopy = useBillingPlanCopy("pro_team_monthly");
  const yearlyPlanCopy = useBillingPlanCopy("pro_team_yearly");

  const createPortal = trpc.organization.createTeamPortalSession.useMutation();
  const createTeamCheckout = trpc.organization.createTeamCheckoutSession.useMutation();
  const cancelSub = trpc.organization.cancelTeamSubscription.useMutation();
  const resumeSub = trpc.organization.resumeTeamSubscription.useMutation();
  const updateTeamMaxMode = trpc.organization.updateTeamMaxModeEnabled.useMutation();
  const updateTeamMaxModeDefaultPolicy =
    trpc.organization.updateTeamMaxModeDefaultPolicy.useMutation();
  const updateMemberMaxModePolicy = trpc.organization.updateTeamMemberMaxModePolicy.useMutation();
  const utils = trpc.useUtils();
  const activeOrganizationId = session.data?.session?.activeOrganizationId ?? null;
  const organizations = organizationsData ?? [];
  const members = (orgDetailsData?.members ?? []).filter(isMember);
  const invitations = (orgDetailsData?.invitations ?? []).filter(isInvitation);
  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");
  const currentUserRole = members.find((member) => member.userId === currentUserId)?.role ?? null;
  const teamBillingQuery = trpc.organization.teamBillingStatus.useQuery(
    { organizationId: activeOrg?.id ?? "" },
    { enabled: Boolean(activeOrg?.id) && currentUserRole === "owner" },
  );
  const teamMaxModeQuery = trpc.organization.teamMaxModeSettings.useQuery(
    { organizationId: activeOrg?.id ?? "" },
    { enabled: Boolean(activeOrg?.id) && currentUserRole === "owner" },
  );
  const teamPlansQuery = trpc.organization.teamPlans.useQuery(undefined, {
    enabled: Boolean(activeOrg?.id) && currentUserRole === "owner",
  });

  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "admin" || isOwner;

  useEffect(() => {
    setActiveOrg(null);
  }, [currentUserId]);

  async function selectOrg(org: Organization, options?: { persistActive?: boolean }) {
    setActiveOrg(org);
    if (options?.persistActive !== false && org.id !== activeOrganizationId) {
      await authClient.organization.setActive({ organizationId: org.id });
      await session.refetch();
    }
  }

  useEffect(() => {
    if (session.isPending) {
      return;
    }

    async function init() {
      // Handle invitation acceptance from URL first (before loading orgs)
      const invitationId = searchParams.get("invitationId");
      if (invitationId) {
        // Remove invitationId from URL immediately to prevent double-accept on remount
        window.history.replaceState({}, "", window.location.pathname);
        const result = await authClient.organization.acceptInvitation({ invitationId });
        if (result.error) {
          console.error("Failed to accept invitation", result.error);
          toast.error(t("Failed to accept invitation"));
        } else {
          toast.success(t("Invitation accepted"));
          await queryClient.invalidateQueries({
            queryKey: ["team", "organizations", currentUserId],
          });
          await session.refetch();
        }
      }
    }
    init();
  }, [currentUserId, searchParams, queryClient, session, t]);

  useEffect(() => {
    if (activeOrg || organizationsLoading) {
      return;
    }

    const nextOrg =
      organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0] ?? null;
    setActiveOrg(nextOrg);
  }, [activeOrg, activeOrganizationId, organizations, organizationsLoading]);

  async function handleCreateOrg() {
    if (!newOrgName.trim()) return;
    setIsCreatingOrg(true);
    try {
      const slug = newOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const result = await authClient.organization.create({
        name: newOrgName.trim(),
        slug,
      });
      if (result.data) {
        const orgs = await queryClient.fetchQuery({
          queryKey: ["team", "organizations", currentUserId],
          queryFn: async () => {
            const listResult = await authClient.organization.list({});
            return (listResult.data ?? []) as Organization[];
          },
        });
        const newOrg = orgs.find((o) => o.id === result.data?.id);
        if (newOrg) {
          await selectOrg(newOrg);
        }
        toast.success(t("Organization created"));
      }
    } catch (error) {
      console.error("Failed to create org", error);
      toast.error(t("Failed to create organization"));
    } finally {
      setIsCreatingOrg(false);
      setIsCreateDialogOpen(false);
      setNewOrgName("");
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !activeOrg) return;
    setIsInviting(true);
    try {
      await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole as "member" | "admin",
        organizationId: activeOrg.id,
      });
      toast.success(t("Invitation sent"));
      await queryClient.invalidateQueries({
        queryKey: ["team", "organization", currentUserId, activeOrg.id],
      });
    } catch (error) {
      console.error("Failed to invite", error);
      toast.error(t("Failed to send invitation"));
    } finally {
      setIsInviting(false);
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!activeOrg) return;
    setIsRemovingMember(true);
    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: activeOrg.id,
      });
      toast.success(t("Member removed"));
      await queryClient.invalidateQueries({
        queryKey: ["team", "organization", currentUserId, activeOrg.id],
      });
      setMemberToRemove(null);
    } catch (error) {
      console.error("Failed to remove member", error);
      toast.error(t("Failed to remove member"));
    } finally {
      setIsRemovingMember(false);
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    try {
      await authClient.organization.cancelInvitation({ invitationId });
      toast.success(t("Invitation cancelled"));
      if (activeOrg) {
        await queryClient.invalidateQueries({
          queryKey: ["team", "organization", currentUserId, activeOrg.id],
        });
      }
    } catch (error) {
      console.error("Failed to cancel invitation", error);
      toast.error(t("Failed to cancel invitation"));
    }
  }

  async function handleSubscribe(planId: "pro_team_monthly" | "pro_team_yearly") {
    if (!activeOrg) return;
    try {
      const result = await createTeamCheckout.mutateAsync({
        organizationId: activeOrg.id,
        planId,
      });
      startTransition(() => {
        push(`/settings/team/checkout/${result.sessionId}?organizationId=${activeOrg.id}`);
      });
    } catch (error) {
      console.error("Failed to create checkout session", error);
      toast.error(error instanceof Error ? error.message : t("Unable to load checkout."));
    }
  }

  async function handleManage() {
    if (!activeOrg) return;
    try {
      const result = await createPortal.mutateAsync({
        organizationId: activeOrg.id,
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(t("Stripe did not return a billing portal URL."));
      }
    } catch (error) {
      console.error("Failed to open portal", error);
      toast.error(t("Failed to open billing portal"));
    }
  }

  async function handleCancel() {
    if (!activeOrg) return;
    try {
      await cancelSub.mutateAsync({ organizationId: activeOrg.id });
      toast.success(t("Subscription will end at period end."));
      utils.organization.teamBillingStatus.invalidate();
    } catch (error) {
      console.error("Failed to cancel", error);
      toast.error(t("Failed to cancel subscription"));
    }
  }

  async function handleResume() {
    if (!activeOrg) return;
    try {
      await resumeSub.mutateAsync({ organizationId: activeOrg.id });
      toast.success(t("Subscription resumed."));
      utils.organization.teamBillingStatus.invalidate();
    } catch (error) {
      console.error("Failed to resume", error);
      toast.error(t("Failed to resume subscription"));
    }
  }

  async function handleTeamMaxModeToggle(enabled: boolean) {
    if (!activeOrg) return;
    try {
      await updateTeamMaxMode.mutateAsync({ organizationId: activeOrg.id, enabled });
      toast.success(enabled ? t("Max Mode enabled.") : t("Max Mode disabled."));
      await Promise.all([
        utils.organization.teamMaxModeSettings.invalidate({ organizationId: activeOrg.id }),
        utils.billing.maxModeStatus.invalidate(),
        utils.billing.usage.invalidate(),
      ]);
    } catch (error) {
      console.error("Failed to update team Max Mode", error);
      toast.error(error instanceof Error ? error.message : t("Failed to update Max Mode."));
    }
  }

  async function updateMemberPolicy(input: {
    userId: string;
    maxModeEnabled: boolean;
    maxModeLimitBasic: number | null;
    maxModeLimitPremium: number | null;
  }) {
    if (!activeOrg) return;
    try {
      await updateMemberMaxModePolicy.mutateAsync({
        organizationId: activeOrg.id,
        ...input,
      });
      await Promise.all([
        utils.organization.teamMaxModeSettings.invalidate({ organizationId: activeOrg.id }),
        utils.billing.maxModeStatus.invalidate(),
        utils.billing.usage.invalidate(),
      ]);
      toast.success(t("Member Max Mode policy updated."));
    } catch (error) {
      console.error("Failed to update member Max Mode policy", error);
      toast.error(error instanceof Error ? error.message : t("Failed to update Max Mode."));
    }
  }

  async function updateDefaultPolicy(input: {
    maxModeEnabled: boolean;
    maxModeLimitBasic: number | null;
    maxModeLimitPremium: number | null;
  }) {
    if (!activeOrg) return;
    try {
      await updateTeamMaxModeDefaultPolicy.mutateAsync({
        organizationId: activeOrg.id,
        ...input,
      });
      await utils.organization.teamMaxModeSettings.invalidate({ organizationId: activeOrg.id });
      toast.success(t("Default Max Mode policy updated."));
    } catch (error) {
      console.error("Failed to update default Max Mode policy", error);
      toast.error(error instanceof Error ? error.message : t("Failed to update Max Mode."));
    }
  }

  async function handleDefaultLimitChange({
    maxModeEnabled,
    maxModeLimitBasic,
    maxModeLimitPremium,
    category,
    value,
  }: {
    maxModeEnabled: boolean;
    maxModeLimitBasic: number | null;
    maxModeLimitPremium: number | null;
    category: "basic" | "premium";
    value: string;
  }) {
    const parsedLimit = parseTokenLimit(value);
    if (parsedLimit === undefined) {
      toast.error(t("Enter a whole number or leave the field blank."));
      return;
    }

    await updateDefaultPolicy({
      maxModeEnabled,
      maxModeLimitBasic: category === "basic" ? parsedLimit : maxModeLimitBasic,
      maxModeLimitPremium: category === "premium" ? parsedLimit : maxModeLimitPremium,
    });
  }

  async function handleMemberLimitChange({
    userId,
    maxModeEnabled,
    maxModeLimitBasic,
    maxModeLimitPremium,
    category,
    value,
  }: {
    userId: string;
    maxModeEnabled: boolean;
    maxModeLimitBasic: number | null;
    maxModeLimitPremium: number | null;
    category: "basic" | "premium";
    value: string;
  }) {
    const parsedLimit = parseTokenLimit(value);
    if (parsedLimit === undefined) {
      toast.error(t("Enter a whole number or leave the field blank."));
      return;
    }

    await updateMemberPolicy({
      userId,
      maxModeEnabled,
      maxModeLimitBasic: category === "basic" ? parsedLimit : maxModeLimitBasic,
      maxModeLimitPremium: category === "premium" ? parsedLimit : maxModeLimitPremium,
    });
  }

  function handleExportMaxModeCsv() {
    const settings = teamMaxModeQuery.data;
    if (!settings || !activeOrg) return;

    const headers = [
      "name",
      "email",
      "role",
      "max_mode_enabled",
      "basic_token_limit",
      "premium_token_limit",
      "basic_tokens_used",
      "premium_tokens_used",
    ];
    const rows = settings.members.map((memberPolicy) => [
      memberPolicy.name ?? "",
      memberPolicy.email,
      memberPolicy.role,
      memberPolicy.maxModeEnabled ? "enabled" : "disabled",
      memberPolicy.maxModeLimitBasic ?? "",
      memberPolicy.maxModeLimitPremium ?? "",
      memberPolicy.maxModeUsageBasic,
      memberPolicy.maxModeUsagePremium,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${activeOrg.slug ?? activeOrg.id}-max-mode.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const isLoading = session.isPending || (organizationsLoading && organizations.length === 0);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // No organizations yet
  if (organizations.length === 0 && !activeOrg) {
    return (
      <SettingsPageShell
        title={t("Team")}
        description={t("Create a team to share Pro access with your members.")}
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <Users className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">{t("No team yet")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Create your first team to get started with Pro for Teams.")}
            </p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="size-4" />
              {t("Create Team")}
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Create Team")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>{t("Team Name")}</Label>
                <Input
                  placeholder={t("e.g. Acme Corp")}
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateOrg();
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleCreateOrg} disabled={isCreatingOrg || !newOrgName.trim()}>
                {isCreatingOrg && <Spinner className="size-3.5" />}
                {t("Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SettingsPageShell>
    );
  }

  const billingStatus = teamBillingQuery.data;
  const hasActivePlan =
    billingStatus?.status &&
    ["active", "trialing", "past_due", "incomplete", "unpaid"].includes(billingStatus.status);
  const isCanceled = billingStatus?.status === "canceled";
  const teamPlans = teamPlansQuery.data?.plans ?? [];
  const monthlyPlan = teamPlans.find((p) => p.id === "pro_team_monthly");
  const yearlyPlan = teamPlans.find((p) => p.id === "pro_team_yearly");
  const teamTrialDays = monthlyPlan?.trialDays ?? yearlyPlan?.trialDays ?? null;
  return (
    <SettingsPageShell
      title={t("Team")}
      description={t("Manage your team and Pro for Teams subscription.")}
      actions={
        <>
          {organizations.length > 1 && (
            <Select
              value={activeOrg?.id ?? ""}
              onValueChange={(val) => {
                const org = organizations.find((o) => o.id === val);
                if (org) selectOrg(org);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="size-3.5" />
            {t("New Team")}
          </Button>
        </>
      }
    >
      {/* Organization Info */}
      {activeOrg && (
        <Card className="!pb-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{activeOrg.name}</CardTitle>
                <CardDescription>
                  {members.length} {members.length === 1 ? t("member") : t("members")}
                  {activeOrg.slug && <span className="text-xs">({activeOrg.slug})</span>}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Team Billing */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Team Billing")}</CardTitle>
            <CardDescription>
              {t("Pro for Teams gives every member Pro-tier access with per-seat pricing.")}
            </CardDescription>
            {teamTrialDays && (
              <div className="pt-2 space-y-2">
                <Badge className="border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300">
                  {t("{days}-day free trial", { days: teamTrialDays.toString() })}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {t("Team trial is available for up to {count} seats.", { count: "5" })}
                </p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {teamBillingQuery.isLoading ? (
              <Spinner />
            ) : hasActivePlan || isCanceled ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-1.5">
                      Pro for Teams
                      {isCanceled && (
                        <Badge variant="secondary">
                          {t("Cancels")}{" "}
                          {billingStatus?.currentPeriodEnd
                            ? monthDayFormatter.format(new Date(billingStatus.currentPeriodEnd))
                            : ""}
                        </Badge>
                      )}
                      {hasActivePlan && !isCanceled && (
                        <Badge className="ml-1.5">{t("Active")}</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {billingStatus?.memberCount ?? 0} {t("seats")}
                      {billingStatus?.currentPeriodEnd &&
                        ` · ${t("Renews")} ${monthDayYearFormatter.format(new Date(billingStatus.currentPeriodEnd))}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleManage}>
                      {t("Manage")}
                    </Button>
                    {isCanceled ? (
                      <Button size="sm" onClick={handleResume} disabled={resumeSub.isPending}>
                        {resumeSub.isPending && <Spinner className="size-3.5" />}
                        {t("Resume")}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancel}
                        disabled={cancelSub.isPending}
                      >
                        {cancelSub.isPending && <Spinner className="size-3.5" />}
                        {t("Cancel")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {monthlyPlan && (
                  <Card className="flex flex-col border-muted">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{t("Pro for Teams")}</CardTitle>
                          <CardDescription className="text-sm">
                            {monthlyPlanCopy.tagline}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {t("Monthly")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col pt-0">
                      <p className="text-2xl font-bold">
                        {formatCurrency(monthlyPlan.amount, monthlyPlan.currency)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{t("seat")}/{t("month")}
                        </span>
                      </p>
                      <PlanHighlights items={monthlyPlanCopy.highlights} className="mt-5 flex-1" />
                      <Button
                        className="mt-5 w-full"
                        disabled={createTeamCheckout.isPending}
                        onClick={() => handleSubscribe("pro_team_monthly")}
                      >
                        {createTeamCheckout.isPending &&
                        createTeamCheckout.variables?.planId === "pro_team_monthly" ? (
                          <Spinner className="size-3.5" />
                        ) : null}
                        {t("Subscribe")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {yearlyPlan && (
                  <Card className="flex flex-col border-muted">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{t("Pro for Teams")}</CardTitle>
                            {yearlyPlanCopy.badge ? (
                              <Badge variant="secondary" className="text-xs">
                                {yearlyPlanCopy.badge}
                              </Badge>
                            ) : null}
                          </div>
                          <CardDescription className="text-sm">
                            {yearlyPlanCopy.tagline}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {t("Yearly")}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col pt-0">
                      <p className="text-2xl font-bold">
                        {formatCurrency(yearlyPlan.amount, yearlyPlan.currency)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{t("seat")}/{t("year")}
                        </span>
                      </p>
                      <PlanHighlights items={yearlyPlanCopy.highlights} className="mt-5 flex-1" />
                      <Button
                        className="mt-5 w-full"
                        disabled={createTeamCheckout.isPending}
                        onClick={() => handleSubscribe("pro_team_yearly")}
                      >
                        {createTeamCheckout.isPending &&
                        createTeamCheckout.variables?.planId === "pro_team_yearly" ? (
                          <Spinner className="size-3.5" />
                        ) : null}
                        {t("Subscribe")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isOwner && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="size-4 text-primary" />
                  {t("Team Max Mode")}
                </CardTitle>
                <CardDescription>
                  {t("Set the team-wide Max Mode switch and per-member overage token limits.")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!teamMaxModeQuery.data}
                  onClick={handleExportMaxModeCsv}
                >
                  <Download className="size-3.5" />
                  {t("Export CSV")}
                </Button>
                <Switch
                  aria-label={t("Enable Max Mode for the team")}
                  checked={teamMaxModeQuery.data?.enabled ?? false}
                  disabled={
                    teamMaxModeQuery.isLoading ||
                    !teamMaxModeQuery.data?.eligible ||
                    updateTeamMaxMode.isPending
                  }
                  onCheckedChange={handleTeamMaxModeToggle}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamMaxModeQuery.isLoading ? (
              <Spinner />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t("Status")}</p>
                    <p className="mt-1 text-sm font-medium">
                      {teamMaxModeQuery.data?.enabled ? t("Enabled") : t("Disabled")}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t("Basic Max Mode usage")}</p>
                    <p className="mt-1 text-sm font-medium">
                      {numberFormatter.format(teamMaxModeQuery.data?.usageBasic ?? 0)} {t("tokens")}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{t("Premium Max Mode usage")}</p>
                    <p className="mt-1 text-sm font-medium">
                      {numberFormatter.format(teamMaxModeQuery.data?.usagePremium ?? 0)}{" "}
                      {t("tokens")}
                    </p>
                  </div>
                </div>

                {teamMaxModeQuery.data?.defaultPolicy && (
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{t("Default member policy")}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("Applied to new members and members without custom settings.")}
                        </p>
                      </div>
                      <Switch
                        aria-label={t("Enable Max Mode by default")}
                        checked={teamMaxModeQuery.data.defaultPolicy.maxModeEnabled}
                        disabled={
                          teamMaxModeQuery.isLoading || updateTeamMaxModeDefaultPolicy.isPending
                        }
                        onCheckedChange={(checked) =>
                          updateDefaultPolicy({
                            maxModeEnabled: checked,
                            maxModeLimitBasic:
                              teamMaxModeQuery.data?.defaultPolicy.maxModeLimitBasic ?? null,
                            maxModeLimitPremium:
                              teamMaxModeQuery.data?.defaultPolicy.maxModeLimitPremium ?? null,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label>{t("Default basic token limit")}</Label>
                        <Input
                          className="h-8"
                          defaultValue={formatTokenLimit(
                            teamMaxModeQuery.data.defaultPolicy.maxModeLimitBasic,
                          )}
                          disabled={
                            teamMaxModeQuery.isLoading || updateTeamMaxModeDefaultPolicy.isPending
                          }
                          inputMode="numeric"
                          placeholder={t("Unlimited")}
                          onBlur={(event) =>
                            handleDefaultLimitChange({
                              maxModeEnabled:
                                teamMaxModeQuery.data?.defaultPolicy.maxModeEnabled ?? true,
                              maxModeLimitBasic:
                                teamMaxModeQuery.data?.defaultPolicy.maxModeLimitBasic ?? null,
                              maxModeLimitPremium:
                                teamMaxModeQuery.data?.defaultPolicy.maxModeLimitPremium ?? null,
                              category: "basic",
                              value: event.currentTarget.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>{t("Default premium token limit")}</Label>
                        <Input
                          className="h-8"
                          defaultValue={formatTokenLimit(
                            teamMaxModeQuery.data.defaultPolicy.maxModeLimitPremium,
                          )}
                          disabled={
                            teamMaxModeQuery.isLoading || updateTeamMaxModeDefaultPolicy.isPending
                          }
                          inputMode="numeric"
                          placeholder={t("Unlimited")}
                          onBlur={(event) =>
                            handleDefaultLimitChange({
                              maxModeEnabled:
                                teamMaxModeQuery.data?.defaultPolicy.maxModeEnabled ?? true,
                              maxModeLimitBasic:
                                teamMaxModeQuery.data?.defaultPolicy.maxModeLimitBasic ?? null,
                              maxModeLimitPremium:
                                teamMaxModeQuery.data?.defaultPolicy.maxModeLimitPremium ?? null,
                              category: "premium",
                              value: event.currentTarget.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="hidden grid-cols-[minmax(0,1fr)_88px_120px_120px] gap-3 px-3 text-xs font-medium text-muted-foreground md:grid">
                    <span>{t("Member")}</span>
                    <span>{t("Enabled")}</span>
                    <span>{t("Basic token limit")}</span>
                    <span>{t("Premium token limit")}</span>
                  </div>
                  {teamMaxModeQuery.data?.members.map((memberPolicy) => (
                    <div
                      key={memberPolicy.userId}
                      className="grid grid-cols-1 items-center gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_88px_120px_120px]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {memberPolicy.name || memberPolicy.email}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {memberPolicy.email}
                        </p>
                      </div>
                      <Switch
                        aria-label={t("Enable Max Mode for {name}", {
                          name: memberPolicy.name || memberPolicy.email,
                        })}
                        checked={memberPolicy.maxModeEnabled}
                        disabled={teamMaxModeQuery.isLoading || updateMemberMaxModePolicy.isPending}
                        onCheckedChange={(checked) =>
                          updateMemberPolicy({
                            userId: memberPolicy.userId,
                            maxModeEnabled: checked,
                            maxModeLimitBasic: memberPolicy.maxModeLimitBasic,
                            maxModeLimitPremium: memberPolicy.maxModeLimitPremium,
                          })
                        }
                      />
                      <div className="space-y-1">
                        <Input
                          aria-label={t("Basic Max Mode token limit for {name}", {
                            name: memberPolicy.name || memberPolicy.email,
                          })}
                          className="h-8"
                          defaultValue={formatTokenLimit(memberPolicy.maxModeLimitBasic)}
                          disabled={
                            teamMaxModeQuery.isLoading || updateMemberMaxModePolicy.isPending
                          }
                          inputMode="numeric"
                          placeholder={t("Unlimited")}
                          onBlur={(event) =>
                            handleMemberLimitChange({
                              userId: memberPolicy.userId,
                              maxModeEnabled: memberPolicy.maxModeEnabled,
                              maxModeLimitBasic: memberPolicy.maxModeLimitBasic,
                              maxModeLimitPremium: memberPolicy.maxModeLimitPremium,
                              category: "basic",
                              value: event.currentTarget.value,
                            })
                          }
                        />
                        <p className="text-[11px] text-muted-foreground">
                          {t("Used {count}", {
                            count: numberFormatter.format(memberPolicy.maxModeUsageBasic),
                          })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Input
                          aria-label={t("Premium Max Mode token limit for {name}", {
                            name: memberPolicy.name || memberPolicy.email,
                          })}
                          className="h-8"
                          defaultValue={formatTokenLimit(memberPolicy.maxModeLimitPremium)}
                          disabled={
                            teamMaxModeQuery.isLoading || updateMemberMaxModePolicy.isPending
                          }
                          inputMode="numeric"
                          placeholder={t("Unlimited")}
                          onBlur={(event) =>
                            handleMemberLimitChange({
                              userId: memberPolicy.userId,
                              maxModeEnabled: memberPolicy.maxModeEnabled,
                              maxModeLimitBasic: memberPolicy.maxModeLimitBasic,
                              maxModeLimitPremium: memberPolicy.maxModeLimitPremium,
                              category: "premium",
                              value: event.currentTarget.value,
                            })
                          }
                        />
                        <p className="text-[11px] text-muted-foreground">
                          {t("Used {count}", {
                            count: numberFormatter.format(memberPolicy.maxModeUsagePremium),
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                  <p>
                    {t(
                      "Blank member limits allow unlimited Max Mode token overage while the team switch is enabled.",
                    )}
                  </p>
                </div>
                {teamMaxModeQuery.data?.auditLog.length ? (
                  <div className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <History className="size-3.5 text-muted-foreground" />
                      {t("Recent policy changes")}
                    </div>
                    <div className="space-y-2">
                      {teamMaxModeQuery.data.auditLog.map((entry) => {
                        const actionLabel =
                          entry.action === "max_mode_enabled"
                            ? t("Team Max Mode enabled")
                            : entry.action === "max_mode_disabled"
                              ? t("Team Max Mode disabled")
                              : entry.action === "default_policy_updated"
                                ? t("Default policy updated")
                                : t("Member policy updated");

                        return (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <span className="text-muted-foreground">{actionLabel}</span>
                            <span className="shrink-0 text-muted-foreground">
                              {dateTimeFormatter.format(new Date(entry.createdAt))}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{t("Members")}</CardTitle>
            <CardDescription>{t("People in your team.")}</CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="size-3.5" />
              {t("Invite")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
                    {m.user.name?.charAt(0) ?? m.user.email?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.user.name || m.user.email}</p>
                    {m.user.name && <p className="text-xs text-muted-foreground">{m.user.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.role === "owner" ? "default" : "secondary"} className="text-xs">
                    {m.role === "owner" && <Crown className="mr-1 size-3" />}
                    {m.role}
                  </Badge>
                  {isAdmin && m.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() =>
                            setMemberToRemove({
                              ...m,
                              user: {
                                ...m.user,
                                image: m.user.image ?? null,
                              },
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                          {t("Remove")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Pending Invitations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                      <Mail className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.role ?? t("Member")} · {t("Expires")}{" "}
                        {monthDayFormatter.format(new Date(inv.expiresAt))}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleCancelInvitation(inv.id)}
                    >
                      {t("Cancel")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Team Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Create Team")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("Team Name")}</Label>
              <Input
                placeholder={t("e.g. Acme Corp")}
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateOrg();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleCreateOrg} disabled={isCreatingOrg || !newOrgName.trim()}>
              {isCreatingOrg && <Spinner className="size-3.5" />}
              {t("Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Invite Member")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("Email")}</Label>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInvite();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Role")}</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{t("Member")}</SelectItem>
                  <SelectItem value="admin">{t("Admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t(
                "When this invitation is accepted, the member joins your team immediately and your billed seat count may change.",
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
              {isInviting && <Spinner className="size-3.5" />}
              {t("Send Invitation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => {
          if (isRemovingMember) return;
          if (!open) setMemberToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Remove member?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("This will remove {name} from the team.", {
                name: memberToRemove?.user.name ?? memberToRemove?.user.email ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingMember}>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRemovingMember}
              loading={isRemovingMember}
              onClick={() => {
                if (memberToRemove) handleRemoveMember(memberToRemove.id);
              }}
            >
              {isRemovingMember && <Spinner className="size-3.5" />}
              {t("Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsPageShell>
  );
}

function TeamSettingsLoading() {
  const t = useExtracted();
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center text-sm text-muted-foreground">
      {t("Loading team settings…")}
    </div>
  );
}

export function TeamSettingsPage() {
  return (
    <Suspense fallback={<TeamSettingsLoading />}>
      <TeamSettingsContent />
    </Suspense>
  );
}
