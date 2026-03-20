import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/env";

type VeoTokenKind = "operation" | "video";

type VeoAccessPayload = {
  kind: VeoTokenKind;
  userId: string;
  value: string;
  exp: number;
};

function sign(payload: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(payload).digest("base64url");
}

export function createVeoAccessToken({
  kind,
  userId,
  value,
  ttlSeconds = 60 * 60,
}: {
  kind: VeoTokenKind;
  userId?: string;
  value: string;
  ttlSeconds?: number;
}) {
  const payload = Buffer.from(
    JSON.stringify({
      kind,
      userId: userId ?? "",
      value,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    } satisfies VeoAccessPayload),
    "utf8",
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyVeoAccessToken(token: string, kind: VeoTokenKind, userId?: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as VeoAccessPayload;
    if (
      parsed.kind !== kind ||
      !userId ||
      parsed.userId !== userId ||
      typeof parsed.value !== "string" ||
      typeof parsed.exp !== "number" ||
      parsed.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}
