import { NextResponse } from "next/server";
import { SEED_ARTWORKS, SEED_GENERATIONS } from "@/lib/supabase/db";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    artworks_count: SEED_ARTWORKS.length,
    generations_count: SEED_GENERATIONS.length,
    message: "Supabase DB sync service operational",
  });
}
