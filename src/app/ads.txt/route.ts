const GOOGLE_CERTIFICATION_AUTHORITY_ID = "f08c47fec0942fa0";

function getPublisherId() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (!clientId) {
    return null;
  }

  return clientId.replace(/^ca-/, "");
}

export function GET() {
  const publisherId = getPublisherId();

  if (!publisherId) {
    return new Response("AdSense publisher ID is not configured.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return new Response(
    `google.com, ${publisherId}, DIRECT, ${GOOGLE_CERTIFICATION_AUTHORITY_ID}\n`,
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
