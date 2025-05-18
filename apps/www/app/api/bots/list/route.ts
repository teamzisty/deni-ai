import { Bot, ClientBot, ServerBot } from "@/types/bot";
import { auth } from "@webcontainer/api";
import {
  authAdmin,
  notAvailable,
  firestoreAdmin,
} from "@workspace/firebase-config/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const authorization = req.headers
      .get("Authorization")
      ?.replace("Bearer ", "");

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

    if (!firestoreAdmin) {
      return NextResponse.json(
        { error: "Firebase is not available" },
        { status: 500 }
      );
    }

    // Save bot data to Firestore
    const botRef = firestoreAdmin.collection("deni-ai-bots");
    const botDoc = await botRef.get();

    const bots: ClientBot[] = [];

    // Limit to 20 bot documents
    const botDocs = botDoc.docs.slice(0, 20);

    // Process each bot document
    for (const doc of botDocs) {
      const botData = doc.data() as ServerBot;
      if (!botData) continue;

      try {
        const botUserId = botData.createdBy.id;
        const botUser = await authAdmin?.getUser(botUserId);

        bots.push({
          id: doc.id,
          name: botData.name,
          description: botData.description,
          instructions: botData.instructions,
          createdBy: {
            name: botUser?.displayName || "Unknown User",
            verified: botUser?.emailVerified || false,
            id: botUserId,
          },
          createdAt: botData.createdAt,
        });
      } catch (error) {
        console.error(`Error processing bot document ${doc.id}:`, error);
        // Continue with next bot if one fails
      }
    }

    return NextResponse.json({
      success: true,
      data: bots,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
