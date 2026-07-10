"use client";

import * as React from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariantProps } from "@/components/ui/button-variants";

type ButtonProps = React.ComponentProps<"button"> &
  ButtonVariantProps & {
    asChild?: boolean;
    /** Base UI render prop (preferred over asChild). */
    render?: React.ComponentProps<typeof ButtonPrimitive>["render"];
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  render: renderProp,
  children,
  ...props
}: ButtonProps) {
  const renderFromAsChild =
    asChild && React.isValidElement(children) ? (children as React.ReactElement) : undefined;
  const render = renderProp ?? renderFromAsChild;
  const hasRender = render !== undefined;

  return (
    <ButtonPrimitive
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      nativeButton={!hasRender}
      render={render}
      {...(props as React.ComponentProps<typeof ButtonPrimitive>)}
    >
      {asChild ? undefined : children}
    </ButtonPrimitive>
  );
}

export { Button, buttonVariants };
