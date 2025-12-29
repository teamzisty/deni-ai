import { env } from "@/env";

export const isBillingDisabled = env.NEXT_PUBLIC_BILLING_DISABLED === "1";
