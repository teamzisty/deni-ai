"use client";

import { Users } from "lucide-react";
import { useExtracted } from "next-intl";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Organization } from "./team-types";

export function TeamOrgHeader({
  activeOrg,
  memberCount,
}: {
  activeOrg: Organization;
  memberCount: number;
}) {
  const t = useExtracted();

  return (
    <Card className="!pb-2">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{activeOrg.name}</CardTitle>
            <CardDescription>
              {memberCount} {memberCount === 1 ? t("member") : t("members")}
              {activeOrg.slug && <span className="text-xs">({activeOrg.slug})</span>}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
