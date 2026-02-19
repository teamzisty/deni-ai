"use client";

import type { VariantProps } from "class-variance-authority";
import { useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button, type buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { User } from "lucide-react";

type GuestSignInButtonProps = VariantProps<typeof buttonVariants> & {
  className?: string;
};

export function GuestSignInButton({
  className,
  size = "lg",
  variant = "outline",
}: GuestSignInButtonProps) {
  const t = useExtracted();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (session) {
    return null;
  }

  const handleClick = async () => {
    if (isPending || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await authClient.signIn.anonymous();
      router.push("/chat");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : t("Failed to sign in as guest. Please try again.");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={isPending || isSubmitting}
    >
      {isSubmitting ? <Spinner className="size-4" /> : <User className="size-4" />}
      {t("Continue as Guest")}
    </Button>
  );
}
