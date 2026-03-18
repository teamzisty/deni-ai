import { and, eq, isNull, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { apiKey, deviceAuthCode } from "@/db/schema";
import { generateApiKey, getKeyPrefix, hashApiKey } from "@/lib/api-key-utils";
import { auth } from "@/lib/auth";
import { decryptFromB64 } from "@/lib/crypto";
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
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const action = z
    .object({
      action: z.enum(["initiate", "approve", "poll"]),
    })
    .safeParse(body);

  if (!action.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  switch (action.data.action) {
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

    const deletedKeys = await db
      .delete(apiKey)
      .where(and(eq(apiKey.id, revokeKeyId), eq(apiKey.userId, userId)))
      .returning({
        id: apiKey.id,
        userId: apiKey.userId,
        name: apiKey.name,
        keyHash: apiKey.keyHash,
        keyPrefix: apiKey.keyPrefix,
        lastUsedAt: apiKey.lastUsedAt,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      });

    const deletedKey = deletedKeys[0];

    if (!deletedKey) {
      return NextResponse.json({ error: "API key not found." }, { status: 404 });
    }

    const approved = await db
      .update(deviceAuthCode)
      .set({ approved: true, userId })
      .where(and(eq(deviceAuthCode.id, row.id), eq(deviceAuthCode.approved, false)))
      .returning({ id: deviceAuthCode.id });

    if (approved.length === 0) {
      await db.insert(apiKey).values(deletedKey);
      return NextResponse.json({ error: "Already approved" }, { status: 409 });
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

/** Extension polls with deviceCode. Once approved, generates API key and returns it once. */
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
    const claimed = await db
      .update(deviceAuthCode)
      .set({
        issuedApiKeyEnc: null,
      })
      .where(
        and(eq(deviceAuthCode.id, row.id), eq(deviceAuthCode.issuedApiKeyEnc, row.issuedApiKeyEnc)),
      )
      .returning({ id: deviceAuthCode.id });

    if (!claimed[0]) {
      return NextResponse.json({ approved: true, apiKeyUnavailable: true });
    }

    return NextResponse.json({
      approved: true,
      apiKey: await decryptFromB64(row.issuedApiKeyEnc),
    });
  }

  const existingKeys = await listUserApiKeys(row.userId);

  if (existingKeys.length >= 5) {
    return apiKeyLimitResponse(row.userId, 403);
  }

  if (row.issuedApiKeyId) {
    return NextResponse.json({ approved: true, apiKeyUnavailable: true });
  }

  const raw = generateApiKey();
  const keyHash = await hashApiKey(raw);
  const keyPrefix = getKeyPrefix(raw);

  const [inserted] = await db
    .insert(apiKey)
    .values({
      userId: row.userId,
      name: "Flixa Extension",
      keyHash,
      keyPrefix,
    })
    .returning({ id: apiKey.id });

  const issued = await db
    .update(deviceAuthCode)
    .set({
      issuedApiKeyId: inserted.id,
      issuedAt: new Date(),
    })
    .where(and(eq(deviceAuthCode.id, row.id), isNull(deviceAuthCode.issuedApiKeyId)))
    .returning({ id: deviceAuthCode.id });

  if (issued.length === 0) {
    await db.delete(apiKey).where(eq(apiKey.id, inserted.id));

    return NextResponse.json({ approved: true, apiKeyUnavailable: true });
  }

  return NextResponse.json({ approved: true, apiKey: raw, apiKeyId: inserted.id });
}
