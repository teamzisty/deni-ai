"use client";

import { loadStripe } from "@stripe/stripe-js";
import { env } from "@/env";

export const stripeJsPromise = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;
