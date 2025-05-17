import {
  authAdmin,
  notAvailable,
  firestoreAdmin,
} from "@workspace/firebase-config/server";
import { DecodedIdToken } from "firebase-admin/auth";
import { NextResponse } from "next/server";

interface BotsCreateRequest {
  name: string;
  description: string;
}

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("Authorization")?.replace("Bearer ", "");

    if (!authorization || notAvailable) {
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    let user: DecodedIdToken;
    try {
      const decodedToken = await authAdmin?.verifyIdToken(authorization);
      if (!decodedToken) {
        return NextResponse.json(
          { error: "Authorization Failed" },
          { status: 401 }
        );
      }
      user = decodedToken;
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Authorization Failed" },
        { status: 401 }
      );
    }

    const { name, description }: BotsCreateRequest = await req.json();

    if (!name || !description) {
      return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    }

    // Create bot id (random UUID)
    const botId = crypto.randomUUID();

    if (!firestoreAdmin) {
      return NextResponse.json(
        { error: "Firebase is not available" },
        { status: 500 }
      );
    }

    // Save bot data to Firestore
    const botRef = firestoreAdmin.collection("deni-ai-bots").doc(botId);
    await botRef.set({
      name,
      description,
      createdBy: {
        name: user.name,
        id: user.uid,
        verified: user.email_verified,
      },
      createdAt: Date.now(), // Timestamp,
    });

    return NextResponse.json({
      success: true,
      botId,
      botUrl: `/bots/${botId}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
