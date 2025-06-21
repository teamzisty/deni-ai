import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";

export function Tip({
  children,
  content,
  ...props
}: {
  children: React.ReactNode;
  content: string;
} & React.ComponentProps<typeof TooltipContent>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent {...props}>
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}
