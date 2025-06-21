import { authCheck } from "@/lib/supabase/server";
import { getAllUsage, getUsageStats } from "@/lib/usage";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { user, success } = await authCheck(req);
  if (!success || !user) {
    return new Response("common.unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "current";
  //   const forceRefresh = searchParams.get("forceRefresh") === "true";
  const days = parseInt(searchParams.get("days") || "1");
  const onlyUsed = searchParams.get("onlyUsed") === "true";
  if (type === "stats") {
    // Get usage statistics
    const stats = await getUsageStats(user.id, days);
    return NextResponse.json({ stats });
  } else {
    // Get current usage for all models
    const usage = await getAllUsage(user.id, onlyUsed);
    return NextResponse.json({ usage });
  }
}
