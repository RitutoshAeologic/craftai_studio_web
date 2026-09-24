import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    const admin = getSupabaseAdmin();
    let query = admin
      .from("jobs")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (userId && userId !== "default" && userId !== "guest") {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[Jobs GET Error]:", error);
      return NextResponse.json({ error: error.message, jobs: [] }, { status: 500 });
    }

    return NextResponse.json({ jobs: data || [] });
  } catch (err: any) {
    console.error("[Jobs GET Handler Error]:", err);
    return NextResponse.json({ error: err?.message, jobs: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let {
      job_id,
      user_id,
      type = "IMAGE_GEN",
      status = "completed",
      prompt,
      image_url,
      preview_url,
      credits_deducted = 0,
      is_download_unlocked = false,
      folder,
    } = body;

    const rawUrl = preview_url || image_url;
    if (!rawUrl) {
      return NextResponse.json({ error: "Missing image/preview url" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    let finalPreviewUrl = rawUrl;

    // Determine target subfolder in user_generations based on tool type
    if (!folder) {
      const typeLower = (type || "").toLowerCase();
      if (typeLower.includes("cutout") || typeLower.includes("remove_bg") || typeLower.includes("remove-bg")) {
        folder = "transparent_cutouts";
      } else if (typeLower.includes("ai_background") || typeLower.includes("ai-background")) {
        folder = "ai_backgrounds";
      } else if (typeLower.includes("expand") || typeLower.includes("outpaint")) {
        folder = "ai_expands";
      } else if (typeLower.includes("upscale")) {
        folder = "upscaled_4k";
      } else if (typeLower.includes("product")) {
        folder = "product_details";
      } else if (typeLower.includes("poster") || typeLower.includes("marketing")) {
        folder = "marketing_posters";
      } else {
        folder = "generations";
      }
    }

    // If rawUrl is base64 or external (not yet on Supabase storage), upload it to user_generations/{folder}
    if (rawUrl.startsWith("data:") || (!rawUrl.includes(".supabase.co/storage/v1/object/public/user_generations/"))) {
      try {
        let buffer: Buffer;
        let contentType = "image/png";

        if (rawUrl.startsWith("data:")) {
          const matches = rawUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            contentType = matches[1];
            buffer = Buffer.from(matches[2], "base64");
          } else {
            buffer = Buffer.from(rawUrl.split(",")[1] || rawUrl, "base64");
          }
        } else {
          const res = await fetch(rawUrl);
          const arrayBuf = await res.arrayBuffer();
          buffer = Buffer.from(arrayBuf);
          contentType = res.headers.get("content-type") || "image/png";
        }

        const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
        const filePath = `${folder}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await admin.storage
          .from("user_generations")
          .upload(filePath, buffer, {
            contentType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: pubData } = admin.storage
            .from("user_generations")
            .getPublicUrl(filePath);
          finalPreviewUrl = pubData.publicUrl;
        } else {
          console.warn("[Jobs Upload Warning]:", uploadError);
        }
      } catch (uploadErr) {
        console.warn("[Jobs Upload Exception]:", uploadErr);
      }
    }

    const assignedJobId = job_id || `gen_${crypto.randomUUID().slice(0, 8)}`;
    const newJob = {
      job_id: assignedJobId,
      user_id: user_id || "de70bc1b-7d20-4d3a-b486-09200c8f8340",
      type: type || "IMAGE_GEN",
      status: status || "completed",
      prompt: prompt || "CraftAI Studio Creation",
      preview_url: finalPreviewUrl,
      credits_deducted: Number(credits_deducted) || 0,
      is_download_unlocked: Boolean(is_download_unlocked),
      download_cost: 2.0,
      created_at: new Date().toISOString(),
      deleted_at: null,
    };

    const { data: inserted, error: insertError } = await admin
      .from("jobs")
      .insert([newJob])
      .select()
      .single();

    if (insertError) {
      console.error("[Jobs Insert Error]:", insertError);
      return NextResponse.json({ error: insertError.message, job: newJob }, { status: 500 });
    }

    return NextResponse.json({ job: inserted || newJob, status: "created" });
  } catch (err: any) {
    console.error("[Jobs POST Handler Error]:", err);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, job_id, is_download_unlocked = true } = body;
    const target = job_id || id;
    if (!target) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("jobs")
      .update({ is_download_unlocked })
      .or(`job_id.eq.${target},id.eq.${target}`)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, updated: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    // Soft delete by updating deleted_at
    const { error } = await admin
      .from("jobs")
      .update({ deleted_at: new Date().toISOString() })
      .or(`job_id.eq.${id},id.eq.${id}`);

    if (error) {
      // Fallback: hard delete
      await admin.from("jobs").delete().or(`job_id.eq.${id},id.eq.${id}`);
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
