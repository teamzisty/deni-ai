import { authAdmin, notAvailable, firestoreAdmin } from "@repo/firebase-config/server";
import { NextResponse } from "next/server";
import { UIMessage } from "ai";

interface ShareRequest {
  sessionId: string;
  title: string;
  messages: UIMessage[];
}

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("Authorization");
    
    if (!authorization || notAvailable) {
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
    }

    let userId: string;
    try {
      const decodedToken = await authAdmin?.verifyIdToken(authorization);
      if (!decodedToken) {
        return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
      }
      userId = decodedToken.uid;
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "認証に失敗しました" }, { status: 401 });
    }

    const { sessionId, title, messages }: ShareRequest = await req.json();

    if (!sessionId || !title || !messages || messages.length === 0) {
      return NextResponse.json({ error: "無効なリクエストです" }, { status: 400 });
    }

    // 共有IDを生成（ランダムなID）
    const shareId = crypto.randomUUID();

    // Firestoreに共有データを保存
    if (!firestoreAdmin) {
      return NextResponse.json({ error: "Firebaseが利用できません" }, { status: 500 });
    }
    
    const sharedChatRef = firestoreAdmin.collection("shared-conversations").doc(shareId);
    await sharedChatRef.set({
      sessionId,
      title,
      messages,
      userId,
      createdAt: new Date(),
      viewCount: 0,
    });

    return NextResponse.json({ 
      success: true, 
      shareId,
      shareUrl: `/shared/${shareId}`
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const shareId = url.searchParams.get("id");

    if (!shareId) {
      return NextResponse.json({ error: "共有IDが指定されていません" }, { status: 400 });
    }

    // Firestoreから共有データを取得
    if (!firestoreAdmin) {
      return NextResponse.json({ error: "Firebaseが利用できません" }, { status: 500 });
    }
    
    const sharedChatRef = firestoreAdmin.collection("shared-conversations").doc(shareId);
    const sharedChatDoc = await sharedChatRef.get();

    if (!sharedChatDoc.exists) {
      return NextResponse.json({ error: "指定された共有チャットが見つかりません" }, { status: 404 });
    }

    const sharedChatData = sharedChatDoc.data();

    // 閲覧数をインクリメント
    await sharedChatRef.set({
      ...sharedChatData,
      viewCount: (sharedChatData?.viewCount || 0) + 1,
    }, { merge: true });

    // Firestoreのタイムスタンプをシリアライズ可能な形式に変換
    const createdAt = sharedChatData?.createdAt;
    const createdAtDate = createdAt && typeof createdAt.toDate === 'function'
      ? createdAt.toDate().toISOString()
      : new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: {
        title: sharedChatData?.title,
        messages: sharedChatData?.messages,
        createdAt: createdAtDate,
        viewCount: (sharedChatData?.viewCount || 0) + 1,
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}