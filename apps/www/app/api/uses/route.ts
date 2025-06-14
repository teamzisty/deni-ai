import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAllUsage, getUsageStats, UsageInfo } from "@/lib/usage";
import {
  getCachedUsage,
  setCachedUsage,
  clearUserCache,
} from "@/lib/usage-cache";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user from token
    const supabase = await createSupabaseServerClient();
    const token = authorization.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "current";
    const forceRefresh = searchParams.get("forceRefresh") === "true";
    const days = parseInt(searchParams.get("days") || "30");
    const onlyUsed = searchParams.get("onlyUsed") === "true";
    if (type === "stats") {
      // If force refresh is true, clear cache
      if (forceRefresh) {
        clearUserCache(user.id);
      }

      // Check cache first
      const cachedStats = getCachedUsage(user.id, "stats");
      if (cachedStats) {
        return NextResponse.json({ stats: cachedStats });
      }

      // Get usage statistics
      const stats = await getUsageStats(user.id, days);
      setCachedUsage(user.id, "stats", stats);
      return NextResponse.json({ stats });
    } else {
      // If force refresh is true, clear cache
      if (forceRefresh) {
        clearUserCache(user.id);
      }
      // Check cache first
      const cacheKey = onlyUsed ? "usage-used" : "usage-all";
      const cachedUsage = getCachedUsage(user.id, cacheKey as any);
      if (cachedUsage) {
        return NextResponse.json({ usage: cachedUsage });
      }

      // Get current usage for all models
      const usage = await getAllUsage(user.id, onlyUsed);
      setCachedUsage(user.id, cacheKey as any, usage);
      return NextResponse.json({ usage });
    }
  } catch (error) {
    console.error("Usage API error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("Authorization");

    if (!authorization) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user from token
    const supabase = await createSupabaseServerClient();
    const token = authorization.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { model } = await req.json();

    if (!model) {
      return new NextResponse("Model is required", { status: 400 });
    } // Record the usage
    const { recordUsage } = await import("@/lib/usage");
    await recordUsage(user.id, model);

    // Clear cache after recording usage
    clearUserCache(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Usage recording error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
