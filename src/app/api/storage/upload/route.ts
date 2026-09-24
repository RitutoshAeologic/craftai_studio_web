import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, bucket = "user_generations", folder = "generations", filename } = body;

    if (!image) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    let buffer: Buffer;
    let contentType = "image/png";

    if (image.startsWith("data:")) {
      const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contentType = matches[1];
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(image.split(",")[1] || image, "base64");
      }
    } else if (image.startsWith("http://") || image.startsWith("https://")) {
      // If it's already hosted on this Supabase storage bucket, return as is!
      if (image.includes(".supabase.co/storage/v1/object/public/")) {
        return NextResponse.json({ public_url: image, status: "already_stored" });
      }
      const fetchRes = await fetch(image);
      const arrayBuf = await fetchRes.arrayBuffer();
      buffer = Buffer.from(arrayBuf);
      contentType = fetchRes.headers.get("content-type") || "image/png";
    } else {
      buffer = Buffer.from(image, "base64");
    }

    const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
    const name = filename || `${crypto.randomUUID()}.${ext}`;
    const filePath = folder ? `${folder}/${name}` : name;

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Storage Upload Error]:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      public_url: publicUrlData.publicUrl,
      path: filePath,
      bucket,
      folder,
      status: "uploaded",
    });
  } catch (err: any) {
    console.error("[Storage API Handler Error]:", err);
    return NextResponse.json({ error: err?.message || "Storage error" }, { status: 500 });
  }
}
