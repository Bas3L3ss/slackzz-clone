import sharp from "sharp";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
// Constants
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const CACHE_DURATION = 60 * 60 * 24; // 24 hours in seconds
const DEFAULT_QUALITY = 80;
const MAX_WIDTH = 1200; // Maximum width to resize to

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");
    const width = searchParams.get("w")
      ? parseInt(searchParams.get("w")!)
      : null;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "image/*",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const contentType = res.headers.get("content-type");
    const contentLength = parseInt(res.headers.get("content-length") || "0");

    if (!res.ok || !contentType?.startsWith("image/")) {
      return NextResponse.json(
        { error: "Failed to fetch image or unsupported format" },
        { status: 400 }
      );
    }

    // Check size
    if (contentLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Image too large" }, { status: 400 });
    }

    const imageBuffer = await res.arrayBuffer();
    const originalBuffer = Buffer.from(imageBuffer);

    // Return SVGs as-is
    if (contentType === "image/svg+xml") {
      return new NextResponse(originalBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": `public, max-age=${CACHE_DURATION}`,
        },
      });
    }

    try {
      // Initialize sharp with the buffer
      let sharpInstance = sharp(originalBuffer);
      const metadata = await sharpInstance.metadata();

      // Resize if needed
      if (width || (metadata.width && metadata.width > MAX_WIDTH)) {
        sharpInstance = sharpInstance.resize({
          width: width || MAX_WIDTH,
          withoutEnlargement: true,
          fit: "inside",
        });
      }

      // Convert to WebP with different handling for GIFs
      const optimizedBuffer = await sharpInstance
        .webp({
          quality: DEFAULT_QUALITY,
          ...(contentType === "image/gif" && { animated: true }),
        })
        .toBuffer();

      return new NextResponse(optimizedBuffer, {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": `public, max-age=${CACHE_DURATION}`,
        },
      });
    } catch (processError) {
      console.error("Error processing image:", processError);
      // Fall back to original image if processing fails
      return new NextResponse(originalBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": `public, max-age=${CACHE_DURATION}`,
        },
      });
    }
  } catch (error) {
    console.error("Error in image proxy:", error);
    return NextResponse.json(
      { error: "Error processing image" },
      { status: 500 }
    );
  }
}
