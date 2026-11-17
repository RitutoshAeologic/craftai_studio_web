'use client'

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchArtworkById, type Artwork } from "@/lib/supabase/db";
import { useTheme } from "@/context/ThemeContext";
import RemixWorkspace from "./RemixWorkspace";

export default function RemixPage({ params }: { params: Promise<{ id: string }> }) {
  const { colors: S } = useTheme();
  const { id } = use(params);
  const router = useRouter();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtworkById(id).then((art) => {
      setArtwork(art);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: S.background, color: S.textSecondary }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #00d4ff", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "13px" }}>Loading Artwork Recipe...</p>
        </div>
      </div>
    );
  }

  const refUrl = artwork?.image_url || artwork?.fallback_url || "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop";

  return (
    <RemixWorkspace
      referenceImage={refUrl}
      initialPrompt={artwork ? `Remix of "${artwork.title}": ${artwork.prompt}` : undefined}
      remixedFromPromptId={artwork?.id || id}
      onBack={() => router.push("/remix")}
    />
  );
}
