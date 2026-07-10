"use client";

import { Crown, MoreHorizontal, Trash2, UserPlus } from "lucide-react";
import { useExtracted } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Member } from "./team-types";

export function TeamMembersList({
  members,
  isAdmin,
  onInviteClick,
  onRemoveClick,
}: {
  members: Member[];
  isAdmin: boolean;
  onInviteClick: () => void;
  onRemoveClick: (member: Member) => void;
}) {
  const t = useExtracted();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{t("Members")}</CardTitle>
          <CardDescription>{t("People in your team.")}</CardDescription>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={onInviteClick}>
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
                          onRemoveClick({
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
  );
}
