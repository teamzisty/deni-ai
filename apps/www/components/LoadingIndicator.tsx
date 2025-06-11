"use client";

import { useLinkStatus } from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";

export default function LoadingIndicator({
  className,
}: {
  className?: string;
}) {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className={cn("animate-spin", className)} /> : null;
}
