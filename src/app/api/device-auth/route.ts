import { eq, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { apiKey, deviceAuthCode } from "@/db/schema";
import { generateApiKey, getKeyPrefix, hashApiKey } from "@/lib/api-key-utils";
import { auth } from "@/lib/auth";
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
  const rateCheck = checkRateLimit({ key: `device-auth:${ip}`, windowMs: 60_000, maxRequests: 5 });
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
  const parsed = z.object({ userCode: z.string().min(1) }).safeParse(body);
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

  await db
    .update(deviceAuthCode)
    .set({ approved: true, userId })
    .where(eq(deviceAuthCode.id, row.id));

  return NextResponse.json({ success: true });
}

/** Extension polls with deviceCode. Once approved, generates API key and returns it (one-time). */
async function handlePoll(body: unknown) {
  const parsed = z.object({ deviceCode: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
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

  // Approved — generate API key and return it
  const raw = generateApiKey();
  const keyHash = await hashApiKey(raw);
  const keyPrefix = getKeyPrefix(raw);

  await db.insert(apiKey).values({
    userId: row.userId,
    name: "Flixa Extension",
    keyHash,
    keyPrefix,
  });

  // Delete the device auth code (one-time use)
  await db.delete(deviceAuthCode).where(eq(deviceAuthCode.id, row.id));

  return NextResponse.json({ approved: true, apiKey: raw });
}
