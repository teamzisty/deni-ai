"use client";

import { Crown, Mail, MoreHorizontal, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useExtracted } from "next-intl";
import { useEffect, useState } from "react";
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

import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
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
    image: string | null;
  };
};

type Invitation = {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: Date;
};

function formatCurrency(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

export function TeamSettingsPage() {
  const t = useExtracted();
  const searchParams = useSearchParams();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

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

  const teamBillingQuery = trpc.organization.teamBillingStatus.useQuery(
    { organizationId: activeOrg?.id ?? "" },
    { enabled: Boolean(activeOrg?.id) && currentUserRole === "owner" },
  );
  const teamPlansQuery = trpc.organization.teamPlans.useQuery(undefined, {
    enabled: Boolean(activeOrg?.id) && currentUserRole === "owner",
  });

  const createCheckout = trpc.organization.createTeamCheckoutSession.useMutation();
  const createPortal = trpc.organization.createTeamPortalSession.useMutation();
  const cancelSub = trpc.organization.cancelTeamSubscription.useMutation();
  const resumeSub = trpc.organization.resumeTeamSubscription.useMutation();
  const utils = trpc.useUtils();

  const isOwner = currentUserRole === "owner";
  const isAdmin = currentUserRole === "admin" || isOwner;

  async function loadOrganizations() {
    try {
      const result = await authClient.organization.list({});
      const orgs = (result.data ?? []) as Organization[];
      setOrganizations(orgs);
      return orgs;
    } catch (error) {
      console.error("Failed to load organizations", error);
      return [];
    }
  }

  async function loadOrgDetails(orgId: string) {
    try {
      const result = await authClient.organization.getFullOrganization({
        query: { organizationId: orgId },
      });
      if (result.data) {
        setMembers((result.data.members ?? []) as unknown as Member[]);
        setInvitations((result.data.invitations ?? []) as unknown as Invitation[]);
      }

      const memberResult = await authClient.organization.getActiveMember({});
      setCurrentUserRole(memberResult.data?.role ?? null);
    } catch (error) {
      console.error("Failed to load org details", error);
    }
  }

  async function selectOrg(org: Organization) {
    setActiveOrg(org);
    await authClient.organization.setActive({ organizationId: org.id });
    await loadOrgDetails(org.id);
  }

  useEffect(() => {
    async function init() {
      setIsLoading(true);

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
        }
      }

      // Load organizations (including any newly joined org)
      const orgs = await loadOrganizations();
      if (orgs.length > 0) {
        // If we just accepted an invitation, select the most recently joined org
        await selectOrg(invitationId ? orgs[orgs.length - 1] : orgs[0]);
      }
      setIsLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const orgs = await loadOrganizations();
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
      await loadOrgDetails(activeOrg.id);
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
    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: activeOrg.id,
      });
      toast.success(t("Member removed"));
      await loadOrgDetails(activeOrg.id);
      setMemberToRemove(null);
    } catch (error) {
      console.error("Failed to remove member", error);
      toast.error(t("Failed to remove member"));
    }
  }

  async function handleCancelInvitation(invitationId: string) {
    try {
      await authClient.organization.cancelInvitation({ invitationId });
      toast.success(t("Invitation cancelled"));
      if (activeOrg) {
        await loadOrgDetails(activeOrg.id);
      }
    } catch (error) {
      console.error("Failed to cancel invitation", error);
      toast.error(t("Failed to cancel invitation"));
    }
  }

  async function handleSubscribe(planId: "pro_team_monthly" | "pro_team_yearly") {
    if (!activeOrg) return;
    try {
      const result = await createCheckout.mutateAsync({
        planId,
        organizationId: activeOrg.id,
      });
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(t("Stripe did not return a checkout URL."));
      }
    } catch (error) {
      console.error("Failed to create checkout", error);
      toast.error(t("Failed to start checkout"));
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
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{t("Team")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("Create a team to share Pro access with your members.")}
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium">{t("No team yet")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Create your first team to get started with Pro for Teams.")}
            </p>
            <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
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
                {isCreatingOrg && <Spinner className="h-3.5 w-3.5" />}
                {t("Create")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("Team")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("Manage your team and Pro for Teams subscription.")}
          </p>
        </div>
        <div className="flex gap-2">
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
          <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            {t("New Team")}
          </Button>
        </div>
      </div>

      {/* Organization Info */}
      {activeOrg && (
        <Card className="!pb-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
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
                            ? new Intl.DateTimeFormat(undefined, {
                                month: "short",
                                day: "numeric",
                              }).format(new Date(billingStatus.currentPeriodEnd))
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
                        ` · ${t("Renews")} ${new Intl.DateTimeFormat(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }).format(new Date(billingStatus.currentPeriodEnd))}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleManage}>
                      {t("Manage")}
                    </Button>
                    {isCanceled ? (
                      <Button size="sm" onClick={handleResume} disabled={resumeSub.isPending}>
                        {resumeSub.isPending && <Spinner className="h-3.5 w-3.5" />}
                        {t("Resume")}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancel}
                        disabled={cancelSub.isPending}
                      >
                        {cancelSub.isPending && <Spinner className="h-3.5 w-3.5" />}
                        {t("Cancel")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {monthlyPlan && (
                  <Card className="border-muted">
                    <CardContent className="py-4">
                      <p className="text-sm font-medium">{t("Monthly")}</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(monthlyPlan.amount, monthlyPlan.currency)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{t("seat")}/{t("month")}
                        </span>
                      </p>
                      <Button
                        className="mt-3 w-full"
                        onClick={() => handleSubscribe("pro_team_monthly")}
                        disabled={createCheckout.isPending}
                      >
                        {createCheckout.isPending && <Spinner className="h-3.5 w-3.5" />}
                        {t("Subscribe")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {yearlyPlan && (
                  <Card className="border-muted">
                    <CardContent className="py-4">
                      <p className="text-sm font-medium">{t("Yearly")}</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(yearlyPlan.amount, yearlyPlan.currency)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /{t("seat")}/{t("year")}
                        </span>
                      </p>
                      <Button
                        className="mt-3 w-full"
                        onClick={() => handleSubscribe("pro_team_yearly")}
                        disabled={createCheckout.isPending}
                      >
                        {createCheckout.isPending && <Spinner className="h-3.5 w-3.5" />}
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

      {/* Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{t("Members")}</CardTitle>
            <CardDescription>{t("People in your team.")}</CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              {t("Invite")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
                    {m.user.name?.charAt(0) ?? m.user.email?.charAt(0) ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.user.name || m.user.email}</p>
                    {m.user.name && <p className="text-xs text-muted-foreground">{m.user.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.role === "owner" ? "default" : "secondary"} className="text-xs">
                    {m.role === "owner" && <Crown className="mr-1 h-3 w-3" />}
                    {m.role}
                  </Badge>
                  {isAdmin && m.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setMemberToRemove(m)}
                        >
                          <Trash2 className="h-4 w-4" />
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
      {invitations.filter((inv) => inv.status === "pending").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Pending Invitations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations
                .filter((inv) => inv.status === "pending")
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.role ?? "member"} · {t("Expires")}{" "}
                          {new Intl.DateTimeFormat(undefined, {
                            month: "short",
                            day: "numeric",
                          }).format(new Date(inv.expiresAt))}
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
              {isCreatingOrg && <Spinner className="h-3.5 w-3.5" />}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
              {isInviting && <Spinner className="h-3.5 w-3.5" />}
              {t("Send Invitation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
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
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (memberToRemove) handleRemoveMember(memberToRemove.id);
              }}
            >
              {t("Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}