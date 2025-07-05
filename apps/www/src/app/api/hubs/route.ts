import { authCheck, createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiTranslations } from "@/lib/api-i18n";

export interface ClientHub {
  id: string;
  name: string;
  description: string;
  files: any[];
  conversations: string[];
  created_by: {
    name: string;
    verified: boolean;
    id: string;
  };
  created_at: number;
}

export async function GET(req: Request) {
  try {
    const t = await getApiTranslations(req, 'common');
    const auth = await authCheck(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        {
          success: false,
          error: t('unauthorized'),
        },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServer();

    // Get hubs from Supabase (limit to 20)
    const { data: hubsData, error } = await supabase
      .from("hubs")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: t('internal_error') },
        { status: 500 },
      );
    }

    const hubs: ClientHub[] = [];

    for (const hub of hubsData || []) {
      const hubUserData = await supabase.auth.admin.getUserById(hub.user_id);
      if (!hubUserData.data.user) {
        continue;
      }

      const hubUser = hubUserData.data.user;

      hubs.push({
        id: hub.id,
        name: hub.name,
        description: hub.description,
        files: hub.files || [],
        conversations: hub.conversations || [],
        created_by: {
          name:
            hubUser.user_metadata?.full_name || hubUser.email || "Unknown User",
          verified: hubUser.email_confirmed_at !== null,
          id: hubUser.id,
        },
        created_at: new Date(hub.created_at).getTime(),
      });
    }

    return NextResponse.json({
      success: true,
      data: hubs,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "common.internal_error" },
      { status: 500 },
    );
  }
}

const hubCreateRequestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

export async function PUT(req: Request) {
  try {
    const t = await getApiTranslations(req, 'common');
    const auth = await authCheck(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        {
          success: false,
          error: t('unauthorized'),
        },
        { status: 401 },
      );
    }

    const supabase = await createSupabaseServer();

    // Get the hub data from the request body
    const body = await req.json();
    const parsedBody = hubCreateRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: t('invalid_request') },
        { status: 400 },
      );
    }

    const { name, description } = parsedBody.data;

    // Create hub id (random UUID)
    const hubId = crypto.randomUUID();

    // Save hub data to Supabase
    const { error } = await supabase.from("hubs").insert({
      id: hubId,
      name,
      description,
      user_id: auth.user?.id,
      files: [],
      conversations: [],
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: t('internal_error') },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      hubId,
      hubUrl: `/hubs/${hubId}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "common.internal_error" },
      { status: 500 },
    );
  }
}