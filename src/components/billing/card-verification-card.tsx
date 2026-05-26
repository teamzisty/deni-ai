"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { Appearance } from "@stripe/stripe-js";
import { CreditCard, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { useExtracted } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { stripeJsPromise } from "@/lib/stripe-js";
import { trpc } from "@/lib/trpc/react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Spinner } from "../ui/spinner";

type Props = {
  isFreeTier: boolean;
  hasVerifiedPaymentMethod: boolean;
};

export function CardVerificationCard({ isFreeTier, hasVerifiedPaymentMethod }: Props) {
  const t = useExtracted();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Only show this card for free-tier users; paid users manage cards via the
  // Stripe portal.
  if (!isFreeTier) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                {t("Verify a card to unlock more usage")}
              </CardTitle>
              {hasVerifiedPaymentMethod && (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="size-3" />
                  {t("Verified")}
                </Badge>
              )}
            </div>
            <CardDescription>
              {hasVerifiedPaymentMethod
                ? t(
                    "Your free tier is boosted: 25M basic / 10M premium tokens per month. We will not charge this card.",
                  )
                : t(
                    "Add a card to lift your monthly limits to 25M basic / 10M premium tokens. We place a $1 hold that is released immediately — no actual charge.",
                  )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardActions
          hasVerifiedPaymentMethod={hasVerifiedPaymentMethod}
          dialogOpen={dialogOpen}
          setDialogOpen={setDialogOpen}
        />
      </CardContent>
    </Card>
  );
}

function CardActions({
  hasVerifiedPaymentMethod,
  dialogOpen,
  setDialogOpen,
}: {
  hasVerifiedPaymentMethod: boolean;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}) {
  const t = useExtracted();
  const utils = trpc.useUtils();
  const removeCard = trpc.billing.removeVerifiedCard.useMutation({
    onSuccess: async () => {
      toast.success(t("Card removed."));
      await utils.billing.usage.invalidate();
      await utils.billing.status.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={hasVerifiedPaymentMethod ? "outline" : "default"}
        size="sm"
        onClick={() => setDialogOpen(true)}
      >
        {hasVerifiedPaymentMethod ? t("Replace card") : t("Add card")}
      </Button>
      {hasVerifiedPaymentMethod && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeCard.mutate()}
          disabled={removeCard.isPending}
        >
          {removeCard.isPending ? <Spinner className="size-3" /> : t("Remove card")}
        </Button>
      )}
      <CardSetupDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function CardSetupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useExtracted();
  const { resolvedTheme } = useTheme();
  const createIntent = trpc.billing.createCardSetupIntent.useMutation();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [setupIntentId, setSetupIntentId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setSetupIntentId(null);
      return;
    }
    let cancelled = false;
    createIntent
      .mutateAsync()
      .then((data) => {
        if (cancelled) return;
        setClientSecret(data.clientSecret);
        setSetupIntentId(data.setupIntentId);
      })
      .catch((err) => {
        toast.error(err?.message ?? t("Failed to start card verification."));
        onOpenChange(false);
      });
    return () => {
      cancelled = true;
    };
    // We intentionally only react to `open` changes here; createIntent is stable
    // for the dialog's lifetime and adding it would re-trigger the SetupIntent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const appearance = useMemo<Appearance>(
    () => ({ theme: resolvedTheme === "dark" ? "night" : "stripe" }),
    [resolvedTheme],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Add card")}</DialogTitle>
          <DialogDescription>
            {t(
              "We place a temporary $1 authorization and release it immediately. Your card is never actually charged.",
            )}
          </DialogDescription>
        </DialogHeader>
        {clientSecret && setupIntentId && stripeJsPromise ? (
          <Elements
            stripe={stripeJsPromise}
            options={{ clientSecret, appearance }}
            key={clientSecret}
          >
            <CardSetupForm setupIntentId={setupIntentId} onDone={() => onOpenChange(false)} />
          </Elements>
        ) : (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CardSetupForm({
  setupIntentId,
  onDone,
}: {
  setupIntentId: string;
  onDone: () => void;
}) {
  const t = useExtracted();
  const stripe = useStripe();
  const elements = useElements();
  const utils = trpc.useUtils();
  const confirmSetup = trpc.billing.confirmCardSetup.useMutation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? t("Card verification failed."));
      setSubmitting(false);
      return;
    }

    try {
      const data = await confirmSetup.mutateAsync({ setupIntentId });
      toast.success(
        data.funding === "prepaid"
          ? t("Card verified (prepaid).")
          : t("Card verified. Free tier boosted."),
      );
      await utils.billing.usage.invalidate();
      await utils.billing.status.invalidate();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Failed to confirm card."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={!stripe || submitting} size="sm">
          {submitting ? <Spinner className="size-3" /> : t("Verify card")}
        </Button>
      </DialogFooter>
    </form>
  );
}
