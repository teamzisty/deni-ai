import { authAdmin, notAvailable, firestoreAdmin } from "@repo/firebase-config/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    if (!firestoreAdmin) {
      return NextResponse.json({ error: "Firebaseが利用できません" }, { status: 500 });
    }
    
    // 共有チャットの一覧を取得（最新の50件）
    const snapshot = await firestoreAdmin
      .collection("shared-conversations")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    
    const chats = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Firestoreのタイムスタンプをシリアライズ可能な形式に変換
      const createdAt = data.createdAt;
      const createdAtDate = createdAt && typeof createdAt.toDate === 'function'
        ? createdAt.toDate().toISOString()
        : new Date().toISOString();
        
      return {
        id: doc.id,
        title: data.title || "無題の会話",
        createdAt: createdAtDate,
        viewCount: data.viewCount || 0,
        messageCount: data.messages?.length || 0,
      };
    });

    return NextResponse.json({ 
      success: true, 
      chats
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}