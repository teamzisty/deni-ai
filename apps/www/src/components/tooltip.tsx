import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

export function Tip({
  children,
  content,
  ...props
}: {
  content: string | React.ReactNode;
  children: React.ReactNode;
} & React.ComponentProps<typeof TooltipContent>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent {...props}>
        {typeof content === "string" ? <p>{content}</p> : content}
      </TooltipContent>
    </Tooltip>
  );
}
