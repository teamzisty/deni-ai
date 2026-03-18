import { NextResponse } from "next/server";

export async function GET(req: Request) {
  void req;
  return NextResponse.json(
    { error: "Legacy image proxy URLs are no longer supported." },
    { status: 410 },
  );
}
