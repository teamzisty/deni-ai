import { firestoreAdmin } from "@/lib/firebase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    if (!firestoreAdmin) {
      return NextResponse.json({
        status: "error",
        error: {
          message: "Firebase is not available.",
          code: "FIREBASE_NOT_AVAILABLE",
        },
      });
    }
    if (json.uuid) {
      const docRef = firestoreAdmin.collection("uses").doc(json.uuid);
      const doc = await docRef.get();

      return NextResponse.json({
        status: "success",
        data: {
          uses: doc.data()?.uses || 0,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      status: "error",
      error: {
        message: "Oops, something went wrong.",
        code: "SOMETHING_WENT_WRONG",
      },
    });
  }
}
