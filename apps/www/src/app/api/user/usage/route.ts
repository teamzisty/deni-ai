import { authCheck } from "@/lib/supabase/server";
import { getAllUsage } from "@/lib/usage";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { user, success } = await authCheck(req);
  if (!success || !user) {
    return new Response("common.unauthorized", { status: 401 });
  }

  const usage = await getAllUsage(user.id)
  return NextResponse.json({
    success: true,
    usage
  })
}
