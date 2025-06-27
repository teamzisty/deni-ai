import { authCheck, createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const HubSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  files: z.array(z.any()).optional(),
  conversations: z.array(z.string()).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authCheck(req);
  if (!auth.success || !auth.user) {
    return NextResponse.json(
      {
        success: false,
        error: "common.unauthorized",
      },
      { status: 401 },
    );
  }

  const { id } = await params;
  const supabase = await createSupabaseServer();

  try {
    // Get hub data from Supabase
    const { data: hubData, error } = await supabase
      .from("hubs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !hubData) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    // Check if the user is the owner of the hub
    const isOwner = hubData.user_id === auth.user.id;

    if (!isOwner) {
      return NextResponse.json(
        { error: "common.unauthorized" },
        { status: 403 },
      );
    }

    const hubUserData = await supabase.auth.admin.getUserById(hubData.user_id);
    if (!hubUserData.data.user) {
      return NextResponse.json({ error: "common.not_found" }, { status: 404 });
    }

    const hubUser = hubUserData.data.user;

    return NextResponse.json({
      success: true,
      data: {
        id: id,
        name: hubData.name,
        description: hubData.description,
        files: hubData.files || [],
        conversations: hubData.conversations || [],
        created_by: {
          name: hubUser.user_metadata?.full_name || hubUser.email || "Unknown User",
          verified: hubUser.email_confirmed_at !== null,
          id: hubData.user_id,
        },
        created_at: new Date(hubData.created_at).getTime(),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "common.internal_error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authCheck(req);
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: "common.unauthorized" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsedBody = HubSchema.partial().safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "common.invalid_request" },
        { status: 400 },
      );
    }
    const { id } = await params;
    
    const { name, description, files, conversations } = parsedBody.data;

    const supabase = await createSupabaseServer();

    // Check if hub exists and user is the owner
    const { data: hubData, error: fetchError } = await supabase
      .from("hubs")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !hubData) {
      return NextResponse.json({ error: "common.not_found" }, { status: 404 });
    }

    if (hubData.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: "common.unauthorized" },
        { status: 403 },
      );
    }

    // Update hub data in Supabase
    const { error } = await supabase
      .from("hubs")
      .update({
        name,
        description,
        files,
        conversations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "common.internal_error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "common.internal_error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authCheck(req);
  if (!auth.success || !auth.user) {
    return NextResponse.json({ error: "common.unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createSupabaseServer();

  try {
    // Check if hub exists and user is the owner
    const { data: hubData, error: fetchError } = await supabase
      .from("hubs")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError || !hubData) {
      return NextResponse.json({ error: "common.not_found" }, { status: 404 });
    }

    if (hubData.user_id !== auth.user.id) {
      return NextResponse.json(
        { error: "common.unauthorized" },
        { status: 403 },
      );
    }

    // Delete hub from Supabase
    const { error } = await supabase.from("hubs").delete().eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "common.internal_error" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "common.internal_error" },
      { status: 500 },
    );
  }
}