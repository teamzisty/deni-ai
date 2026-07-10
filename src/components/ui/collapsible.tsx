"use client";

import type * as React from "react";
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

import { resolveRenderProps } from "@/lib/base-ui-compat";

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root> & { asChild?: boolean }) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...resolveRenderProps(props)} />;
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Trigger> & { asChild?: boolean }) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...resolveRenderProps(props)} />
  );
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Panel> & { asChild?: boolean }) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...resolveRenderProps(props)} />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
