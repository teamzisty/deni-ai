import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathParams } = await params;

    if (!pathParams || pathParams.length < 2) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const [slug, ...filePathParts] = pathParams;
    const fileName = filePathParts.join("/");

    if (!slug || !fileName) {
      return new NextResponse("Invalid slug or filename", { status: 400 });
    }

    // Construct the file path
    const contentDirectory = path.join(process.cwd(), "content");
    const filePath = path.join(contentDirectory, "blog", slug, fileName);

    // Security check: make sure the file is within the content directory
    const absoluteContentDir = path.resolve(contentDirectory);
    const absoluteFilePath = path.resolve(filePath);

    if (!absoluteFilePath.startsWith(absoluteContentDir)) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(absoluteFilePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Check if it's actually a file (not a directory)
    const stat = fs.statSync(absoluteFilePath);
    if (!stat.isFile()) {
      return new NextResponse("Not a file", { status: 400 });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(absoluteFilePath);

    // Determine content type based on file extension
    const ext = path.extname(fileName).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
      case ".svg":
        contentType = "image/svg+xml";
        break;
    }

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving blog asset:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
