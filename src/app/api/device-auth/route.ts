import { and, eq, isNull, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { apiKey, deviceAuthCode } from "@/db/schema";
import { generateApiKey, getKeyPrefix, hashApiKey } from "@/lib/api-key-utils";
import { auth } from "@/lib/auth";
import { decryptFromB64, encryptToB64 } from "@/lib/crypto";
import { checkRateLimit } from "@/lib/rate-limit";

function generateUserCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

function generateDeviceCode(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function listUserApiKeys(userId: string) {
  return db
    .select({
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
    })
    .from(apiKey)
    .where(eq(apiKey.userId, userId))
    .orderBy(apiKey.createdAt);
}

async function apiKeyLimitResponse(userId: string, status: 403 | 409) {
  return NextResponse.json(
    {
      code: "API_KEY_LIMIT_REACHED",
      error: "Maximum of 5 API keys allowed. Revoke an existing key first.",
      apiKeys: await listUserApiKeys(userId),
    },
    { status },
  );
}

export async function POST(req: Request) {
  const body = await req.json();
  const action = z.enum(["initiate", "approve", "poll"]).safeParse(body?.action);

  if (!action.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  switch (action.data) {
    case "initiate":
      return handleInitiate(req);
    case "approve":
      return handleApprove(body);
    case "poll":
      return handlePoll(body);
  }
}

/** Extension calls this to start the flow. Returns userCode (shown to user) and deviceCode (for polling). */
async function handleInitiate(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateCheck = await checkRateLimit({
    key: `device-auth:${ip}`,
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } },
    );
  }

  // Clean up expired codes to prevent DB bloat
  await db.delete(deviceAuthCode).where(lt(deviceAuthCode.expiresAt, new Date()));

  const userCode = generateUserCode();
  const deviceCode = generateDeviceCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await db.insert(deviceAuthCode).values({
    userCode,
    deviceCode,
    expiresAt,
  });

  return NextResponse.json({ userCode, deviceCode, expiresIn: 900 });
}

/** User clicks "Approve" on the web page. Requires session. */
async function handleApprove(body: unknown) {
  const parsed = z
    .object({
      userCode: z.string().min(1),
      revokeKeyId: z.string().min(1).optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.session?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [row] = await db
    .select()
    .from(deviceAuthCode)
    .where(eq(deviceAuthCode.userCode, parsed.data.userCode))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  }

  if (row.expiresAt < new Date()) {
    return NextResponse.json({ error: "Code expired" }, { status: 410 });
  }

  if (row.approved) {
    return NextResponse.json({ error: "Already approved" }, { status: 409 });
  }

  const existingKeys = await listUserApiKeys(userId);

  if (existingKeys.length >= 5) {
    const revokeKeyId = parsed.data.revokeKeyId;

    if (!revokeKeyId) {
      return apiKeyLimitResponse(userId, 409);
    }

    try {
      await db.transaction(async (tx) => {
        const claimed = await tx
          .update(deviceAuthCode)
          .set({ approved: true, userId })
          .where(and(eq(deviceAuthCode.id, row.id), eq(deviceAuthCode.approved, false)))
          .returning({ id: deviceAuthCode.id });

        if (claimed.length === 0) {
          throw new Error("DEVICE_AUTH_ALREADY_CLAIMED");
        }

        const deleted = await tx
          .delete(apiKey)
          .where(and(eq(apiKey.id, revokeKeyId), eq(apiKey.userId, userId)))
          .returning({ id: apiKey.id });

        if (deleted.length === 0) {
          throw new Error("API_KEY_NOT_FOUND");
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message === "API_KEY_NOT_FOUND") {
        return NextResponse.json({ error: "API key not found." }, { status: 404 });
      }
      if (error instanceof Error && error.message === "DEVICE_AUTH_ALREADY_CLAIMED") {
        return NextResponse.json({ error: "Already approved" }, { status: 409 });
      }

      throw error;
    }
  } else {
    const approved = await db
      .update(deviceAuthCode)
      .set({ approved: true, userId })
      .where(and(eq(deviceAuthCode.id, row.id), eq(deviceAuthCode.approved, false)))
      .returning({ id: deviceAuthCode.id });

    if (approved.length === 0) {
      return NextResponse.json({ error: "Already approved" }, { status: 409 });
    }
  }

  return NextResponse.json({ success: true });
}

/** Extension polls with deviceCode. Once approved, generates API key and returns it (one-time). */
async function handlePoll(body: unknown) {
  const parsed = z.object({ deviceCode: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Rate limit poll requests per deviceCode
  const rateCheck = await checkRateLimit({
    key: `device-poll:${parsed.data.deviceCode}`,
    windowMs: 10_000,
    maxRequests: 3,
  });
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } },
    );
  }

  const [row] = await db
    .select()
    .from(deviceAuthCode)
    .where(eq(deviceAuthCode.deviceCode, parsed.data.deviceCode))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Invalid device code" }, { status: 404 });
  }

  if (row.expiresAt < new Date()) {
    await db.delete(deviceAuthCode).where(eq(deviceAuthCode.id, row.id));
    return NextResponse.json({ error: "Code expired" }, { status: 410 });
  }

  if (!row.approved || !row.userId) {
    return NextResponse.json({ approved: false });
  }

  if (row.issuedApiKeyEnc) {
    return NextResponse.json({
      approved: true,
      apiKey: await decryptFromB64(row.issuedApiKeyEnc),
    });
  }

  const existingKeys = await listUserApiKeys(row.userId);

  if (existingKeys.length >= 5) {
    return apiKeyLimitResponse(row.userId, 403);
  }

  const raw = generateApiKey();
  const keyHash = await hashApiKey(raw);
  const keyPrefix = getKeyPrefix(raw);
  const issuedApiKeyEnc = await encryptToB64(raw);

  try {
    const createdKey = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(apiKey)
        .values({
          userId: row.userId!,
          name: "Flixa Extension",
          keyHash,
          keyPrefix,
        })
        .returning({ id: apiKey.id });

      const issued = await tx
        .update(deviceAuthCode)
        .set({
          issuedApiKeyEnc,
          issuedApiKeyId: inserted.id,
          issuedAt: new Date(),
        })
        .where(and(eq(deviceAuthCode.id, row.id), isNull(deviceAuthCode.issuedApiKeyEnc)))
        .returning({ id: deviceAuthCode.id });

      if (issued.length === 0) {
        throw new Error("DEVICE_AUTH_ALREADY_ISSUED");
      }

      return inserted;
    });

    return NextResponse.json({ approved: true, apiKey: raw, apiKeyId: createdKey.id });
  } catch (error) {
    if (error instanceof Error && error.message === "DEVICE_AUTH_ALREADY_ISSUED") {
      const [issuedRow] = await db
        .select({ issuedApiKeyEnc: deviceAuthCode.issuedApiKeyEnc })
        .from(deviceAuthCode)
        .where(eq(deviceAuthCode.id, row.id))
        .limit(1);

      if (issuedRow?.issuedApiKeyEnc) {
        return NextResponse.json({
          approved: true,
          apiKey: await decryptFromB64(issuedRow.issuedApiKeyEnc),
        });
      }
    }

    throw error;
  }
}
