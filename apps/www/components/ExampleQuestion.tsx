import React from "react";
import { cn } from "@workspace/ui/lib/utils";

interface ExampleQuestionProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}

export const ExampleQuestion: React.FC<ExampleQuestionProps> = ({
  children,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left py-3 px-4 rounded-lg border-b border-b-border hover:bg-accent transition-colors duration-200 text-muted-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
};
