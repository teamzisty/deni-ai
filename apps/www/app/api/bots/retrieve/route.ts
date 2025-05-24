import { ServerBot } from "@/types/bot";
import {
  authAdmin,
  notAvailable,
  firestoreAdmin,
} from "@workspace/firebase-config/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
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
    const botId = url.searchParams.get("id");

    if (!botId) {
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
    const botRef = firestoreAdmin.collection("deni-ai-bots").doc(botId);
    const botDoc = await botRef.get();

    if (!botDoc.exists) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    const botData = botDoc.data() as ServerBot;
    if (!botData) {
      return NextResponse.json({ error: "Bot data not found" }, { status: 404 });
    }

    const botUserId = botData.createdBy.id;
    const botUser = await authAdmin?.getUser(botUserId);
    if (!botUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the user is the owner of the bot
    let isOwner = false;
    if (botUserId == userId) {
      isOwner = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: botId,
        name: botData.name,
        description: botData.description,
        instructions: botData.instructions,
        systemInstruction: isOwner ? botData.systemInstruction : null,
        createdBy: {
          name: botUser.displayName,
          verified: botUser.emailVerified,
          id: botUserId,
        },
        createdAt: botData.createdAt,
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
