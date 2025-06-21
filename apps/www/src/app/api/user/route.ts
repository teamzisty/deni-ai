import { authCheck, createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const user = await authCheck(req);
  if (!user.success || !user.user) {
    return new Response("common.unauthorized", { status: 401 });
  }

  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.user.id);

  if (error) {
    console.error("Supabase error:", error);
    return new Response("common.error", { status: 500 });
  }

  return NextResponse.json({
    user: data[0] || null,
  });
}
