import { cn } from "@workspace/ui/lib/utils";
import { Loader2 } from "lucide-react";
import { useLinkStatus } from "next/link";

export default function LoadingIndicator({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { pending } = useLinkStatus();
  return pending ? <Loader2 className={cn("animate-spin", className)} /> : children;
}
