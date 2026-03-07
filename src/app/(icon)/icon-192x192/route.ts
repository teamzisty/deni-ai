import { readFile } from "node:fs/promises";
import { join } from "node:path";

const iconPath = join(process.cwd(), "public", "pwa", "android-chrome-192x192.png");

export async function GET() {
  const icon = await readFile(iconPath);

  return new Response(icon, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
    },
  });
}
