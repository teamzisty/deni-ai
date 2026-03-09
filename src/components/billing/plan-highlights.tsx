import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanHighlightsProps = {
  items: string[];
  className?: string;
};

export function PlanHighlights({ items, className }: PlanHighlightsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">{item}</span>
        </li>
      ))}
    </ul>
  );
}
