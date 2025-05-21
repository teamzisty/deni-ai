import { ServerBot } from "@/types/bot";
import {
  authAdmin,
  notAvailable,
  firestoreAdmin,
} from "@workspace/firebase-config/server";
import { NextResponse } from "next/server";

interface BotsCreateRequest extends ServerBot {
  id: string;
}

export async function DELETE(req: Request) {
  try {
    const authorization = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!authorization || notAvailable) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    let userId: string;
    try {
      const decodedToken = await authAdmin?.verifyIdToken(authorization);
      if (!decodedToken) {
        return NextResponse.json(
          { error: "Authorization Failed" },
          { status: 401 }
        );
      }
      userId = decodedToken.uid;
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Bot ID is not specified" },
        { status: 400 }
      );
    }

    if (!firestoreAdmin) {
      return NextResponse.json(
        { error: "Firebase is not available" },
        { status: 500 }
      );
    }

    // Save bot data to Firestore
    const botRef = firestoreAdmin.collection("deni-ai-bots").doc(id);
    const botDoc = await botRef.get();
    if (!botDoc.exists) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const botData = botDoc.data() as ServerBot;
    if (!botData) {
      return NextResponse.json({ error: "Bot data not found" }, { status: 404 });
    }

    if (botData.createdBy.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await botRef.delete();

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
