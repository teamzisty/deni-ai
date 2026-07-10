"use client";

import * as React from "react";
import { PreviewCard as HoverCardPrimitive } from "@base-ui/react/preview-card";

import { cn } from "@/lib/utils";
import { resolveRenderProps } from "@/lib/base-ui-compat";

type HoverCardContextValue = { openDelay?: number; closeDelay?: number };
const HoverCardContext = React.createContext<HoverCardContextValue>({});

function HoverCard({
  openDelay,
  closeDelay,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root> & {
  openDelay?: number;
  closeDelay?: number;
}) {
  return (
    <HoverCardContext.Provider value={{ openDelay, closeDelay }}>
      <HoverCardPrimitive.Root data-slot="hover-card" {...props} />
    </HoverCardContext.Provider>
  );
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger> & { asChild?: boolean }) {
  const { openDelay } = React.useContext(HoverCardContext);
  return (
    <HoverCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      delay={openDelay}
      {...resolveRenderProps(props)}
    />
  );
}

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Popup> & {
  align?: "start" | "center" | "end";
  sideOffset?: number;
}) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        sideOffset={sideOffset}
      >
        <HoverCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden transition-[opacity,scale] data-[side=bottom]:origin-top data-[side=left]:origin-right data-[side=right]:origin-left data-[side=top]:origin-bottom data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
            className,
          )}
          {...props}
        />
      </HoverCardPrimitive.Positioner>
    </HoverCardPrimitive.Portal>
  );
}

export { HoverCard, HoverCardTrigger, HoverCardContent };
