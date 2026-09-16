import { createClient } from "./client";

export interface Artwork {
  id: string;
  title: string;
  prompt: string;
  masked_summary?: string;
  image_url: string;
  fallback_url?: string;
  model: string;
  category: string;
  likes_count: number;
  remix_count?: number;
  remix_fee?: number;
  creator_royalty_cut?: number;
  author_name: string;
  author_handle: string;
  author_avatar: string;
  seed: number;
  aspect_ratio?: string;
  width: number;
  height: number;
  created_at?: string;
}

export interface Generation {
  id: string;
  prompt: string;
  image_url: string;
  model: string;
  aspect_ratio: string;
  seed?: number;
  user_id?: string;
  user_email?: string;
  created_at: string;
  is_download_unlocked?: boolean;
  credits_deducted?: number;
  type?: string;
}

export interface Wallet {
  user_id: string;
  credits: number;
  purchased_balance: number;
  earned_royalty_balance: number;
}

export interface ChatMessage {
  id?: string;
  session_id?: string;
  role: "user" | "ai";
  content: string;
  time?: string;
  created_at?: string;
}

/* ── Initial seed dataset matching Figma prototype ──────────── */
export const SEED_ARTWORKS: Artwork[] = [
  {
    id: "1",
    title: "Cyberpunk Warrior",
    prompt: "cyberpunk warrior dark armor glowing eyes futuristic city",
    masked_summary: "Cyber Ronin • Wet Neon Street • 85mm Bokeh • [Secret Recipe Encrypted]",
    image_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop",
    fallback_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop",
    model: "FLUX.1",
    category: "Cyberpunk",
    likes_count: 287,
    remix_count: 42,
    remix_fee: 4.0,
    creator_royalty_cut: 1.6,
    author_name: "Neo Grid",
    author_handle: "neo_grid",
    author_avatar: "NG",
    seed: 2001,
    width: 512,
    height: 640,
  },
  {
    id: "2",
    title: "Bioluminescent Circuit Leaf",
    prompt: "macro circuit board leaf vein glowing green bioluminescent",
    masked_summary: "Bioluminescent Macro • Emerald Circuitry • Octane Render",
    image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    fallback_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    model: "FLUX.1",
    category: "3D Render",
    likes_count: 342,
    remix_count: 59,
    remix_fee: 4.0,
    creator_royalty_cut: 1.6,
    author_name: "Cyber Bot",
    author_handle: "cyber_bot_2",
    author_avatar: "NG",
    seed: 2002,
    width: 512,
    height: 360,
  },
  {
    id: "3",
    title: "Gold Chrome Fluid Ribbon",
    prompt: "elegant butterfly gold chrome minimal white background",
    masked_summary: "Gold Chrome Fluid • Minimalist Luxury • Studio White",
    image_url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop",
    fallback_url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop",
    model: "Turbo",
    category: "3D Render",
    likes_count: 91,
    remix_count: 14,
    remix_fee: 3.0,
    creator_royalty_cut: 1.2,
    author_name: "Meta Maker",
    author_handle: "meta_maker",
    author_avatar: "MM",
    seed: 2003,
    width: 512,
    height: 340,
  },
  {
    id: "4",
    title: "Storybook Countryside Cottage",
    prompt: "storybook countryside cottage rolling green hills clouds",
    masked_summary: "Makoto Shinkai Pastoral • Golden Clouds • Whimsical Anime",
    image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop",
    fallback_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=600&auto=format&fit=crop",
    model: "SDXL",
    category: "Anime",
    likes_count: 226,
    remix_count: 38,
    remix_fee: 4.0,
    creator_royalty_cut: 1.6,
    author_name: "Story Draw",
    author_handle: "story_draw",
    author_avatar: "SD",
    seed: 2004,
    width: 512,
    height: 430,
  },
  {
    id: "5",
    title: "Futuristic Glass Towers",
    prompt: "futuristic architecture glass towers light trails city",
    masked_summary: "Solarpunk Architecture • Crystal Towers • Twilight Speedtrails",
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    fallback_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    model: "SDXL",
    category: "3D Render",
    likes_count: 143,
    remix_count: 19,
    remix_fee: 3.5,
    creator_royalty_cut: 1.4,
    author_name: "Urban Rays",
    author_handle: "urban_rays",
    author_avatar: "UR",
    seed: 2005,
    width: 512,
    height: 360,
  },
  {
    id: "6",
    title: "Cozy Greenhouse Cafe",
    prompt: "cozy greenhouse cafe people plants warm light bokeh",
    masked_summary: "Hygge Greenhouse • Warm Amber Bokeh • 35mm Film Grain",
    image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop",
    fallback_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=600&auto=format&fit=crop",
    model: "SDXL",
    category: "Photorealism",
    likes_count: 198,
    remix_count: 27,
    remix_fee: 4.0,
    creator_royalty_cut: 1.6,
    author_name: "Cozy Gen",
    author_handle: "cozy_gen",
    author_avatar: "CG",
    seed: 2006,
    width: 512,
    height: 430,
  },
  {
    id: "7",
    title: "Massive Volcanic Eruption",
    prompt: "massive volcanic eruption fire smoke dramatic sky lightning",
    masked_summary: "Volcanic Lightning Plume • Crimson Magma • National Geographic 8K",
    image_url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600&auto=format&fit=crop",
    fallback_url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=600&auto=format&fit=crop",
    model: "FLUX.1",
    category: "Photorealism",
    likes_count: 504,
    remix_count: 88,
    remix_fee: 4.0,
    creator_royalty_cut: 1.6,
    author_name: "Volcano M",
    author_handle: "volcano_m",
    author_avatar: "VM",
    seed: 2007,
    width: 512,
    height: 430,
  },
  {
    id: "8",
    title: "Futuristic Jungle Infrastructure",
    prompt: "futuristic jungle infrastructure glass bridges green vines",
    masked_summary: "Biolithic Rainforest • Suspended Maglev Bridges • Volumetric Mist",
    image_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=600&auto=format&fit=crop",
    fallback_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=600&auto=format&fit=crop",
    model: "FLUX.1",
    category: "Cyberpunk",
    likes_count: 387,
    remix_count: 63,
    remix_fee: 4.0,
    creator_royalty_cut: 1.6,
    author_name: "Sarah Jenkins",
    author_handle: "sarah_j",
    author_avatar: "SJ",
    seed: 2008,
    width: 512,
    height: 340,
  },
];

export const SEED_GENERATIONS: Generation[] = [
  {
    id: "gen-1",
    prompt: "surreal cosmic landscape, glowing iridescent nebula clouds, glowing geometric obsidian monolith centered",
    image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop",
    model: "Flux Schnell",
    aspect_ratio: "1:1",
    seed: 7777,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "gen-2",
    prompt: "neon cyberpunk city night rain cinematic reflections",
    image_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop",
    model: "Flux Schnell",
    aspect_ratio: "1:1",
    seed: 1001,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "gen-3",
    prompt: "futuristic tower golden sunrise aerial perspective",
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=600&auto=format&fit=crop",
    model: "SDXL",
    aspect_ratio: "16:9",
    seed: 1002,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "gen-4",
    prompt: "robot warrior cyborg portrait glowing blue ocular sensors",
    image_url: "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?q=80&w=600&auto=format&fit=crop",
    model: "Turbo",
    aspect_ratio: "1:1",
    seed: 1003,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: "gen-5",
    prompt: "colorful abstract fluid art explosion in water",
    image_url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600&auto=format&fit=crop",
    model: "Flux Schnell",
    aspect_ratio: "1:1",
    seed: 1004,
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

/* ── Local Storage Cache Keys for Zero-Latency ───────────────── */
const ARTWORKS_KEY = "craftai_db_artworks_v1";
const GENERATIONS_KEY = "craftai_db_generations_v1";

/* ── Fetch Artworks with 0-Latency Optimistic Cache ──────────── */
export async function fetchArtworks(): Promise<Artwork[]> {
  // 1. Check local cache first for 0ms instant render
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(ARTWORKS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Trigger async background sync with Supabase
          syncArtworksFromSupabase();
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage error
    }
  }

  // 2. Try fetching from Supabase DB
  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(ARTWORKS_KEY, JSON.stringify(data));
        }
        return data as Artwork[];
      }
    } catch (e) {
      console.warn("Supabase artworks fetch fallback to seeded data", e);
    }
  }

  // 3. Fallback to seed data and store in cache
  if (typeof window !== "undefined") {
    localStorage.setItem(ARTWORKS_KEY, JSON.stringify(SEED_ARTWORKS));
  }
  return SEED_ARTWORKS;
}

async function syncArtworksFromSupabase() {
  const supabase = createClient();
  if (!supabase) return;
  try {
    const { data } = await supabase.from("artworks").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0 && typeof window !== "undefined") {
      localStorage.setItem(ARTWORKS_KEY, JSON.stringify(data));
    }
  } catch {
    // Background sync error safely ignored
  }
}

/* ── User-Scoped Cache Key Helper ────────────────────────────── */
export function getUserGenerationsKey(userIdentifier?: string): string {
  if (!userIdentifier || userIdentifier === "default" || userIdentifier === "guest") {
    return "craftai_db_generations_v1";
  }
  const clean = userIdentifier.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return `craftai_generations_${clean}`;
}

/* ── Fetch Generations History (User-Scoped, No Mock Seed Rebirth) ─ */
export async function fetchGenerations(userIdentifier?: string): Promise<Generation[]> {
  const key = getUserGenerationsKey(userIdentifier);

  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(key);
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          // Filter out junk/test and static seed items so user only sees real generations
          const userGens = parsed.filter((g: Generation) => {
            if (!g || !g.id) return false;
            if (["gen-1", "gen-2", "gen-3", "gen-4", "gen-5"].includes(g.id)) return false;
            const p = (g.prompt || "").trim().toLowerCase();
            return p.length >= 3 && !p.startsWith("hrll") && !p.startsWith("test");
          });
          return userGens;
        }
      }
    } catch {
      // Ignore JSON error
    }
  }

  // If Supabase table exists, try fetching records associated with user
  const supabase = createClient();
  if (supabase && userIdentifier && userIdentifier !== "default" && userIdentifier !== "guest") {
    try {
      let query = supabase.from("generations").select("*").order("created_at", { ascending: false });
      if (userIdentifier.includes("@")) {
        query = query.eq("user_email", userIdentifier);
      } else {
        query = query.eq("user_id", userIdentifier);
      }
      const { data, error } = await query;

      if (!error && data) {
        if (typeof window !== "undefined") {
          localStorage.setItem(key, JSON.stringify(data));
        }
        return data as Generation[];
      }
    } catch {
      // Ignore Supabase error
    }
  }

  // When user has no generations or deleted them all, return clean empty list
  if (typeof window !== "undefined") {
    if (localStorage.getItem(key) === null) {
      localStorage.setItem(key, JSON.stringify([]));
    }
  }
  return [];
}

/* ── Save or Update a Generation in DB & Cache (User Associated & Session Aware) ────── */
export async function saveGeneration(
  gen: Omit<Generation, "id" | "created_at">,
  userIdentifier?: string,
  existingId?: string | null
): Promise<Generation> {
  const cleanPrompt = (gen.prompt || "").trim();
  if (!cleanPrompt || cleanPrompt.length < 3 || cleanPrompt.toLowerCase().startsWith("hrll")) {
    throw new Error("Invalid prompt");
  }

  const resolvedUserEmail = gen.user_email || (userIdentifier && userIdentifier.includes("@") ? userIdentifier : undefined);
  const resolvedUserId = gen.user_id || (userIdentifier && !userIdentifier.includes("@") ? userIdentifier : undefined);
  const key = getUserGenerationsKey(userIdentifier || resolvedUserEmail || resolvedUserId);

  let targetId = existingId || null;
  let isUpdate = false;

  // Check if targetId exists in cache
  if (targetId && typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(key);
      const current: Generation[] = cached ? JSON.parse(cached) : [];
      if (current.some((g) => g.id === targetId)) {
        isUpdate = true;
      }
    } catch {}
  }

  if (!targetId || !isUpdate) {
    targetId = `gen-${Date.now()}`;
  }

  const savedGen: Generation = {
    ...gen,
    id: targetId,
    prompt: cleanPrompt,
    user_email: resolvedUserEmail,
    user_id: resolvedUserId,
    created_at: new Date().toISOString(),
  };

  // 1. Optimistically update local cache immediately (0ms delay)
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(key);
      const current: Generation[] = cached ? JSON.parse(cached) : [];
      const cleanCurrent = Array.isArray(current)
        ? current.filter((g) => !["gen-1", "gen-2", "gen-3", "gen-4", "gen-5"].includes(g.id))
        : [];
      
      const filtered = cleanCurrent.filter((g) => g.id !== targetId);
      const updated = [savedGen, ...filtered].slice(0, 30);
      localStorage.setItem(key, JSON.stringify(updated));

      // Also update default key if distinct
      if (key !== GENERATIONS_KEY) {
        try {
          const defCached = localStorage.getItem(GENERATIONS_KEY);
          const defCurrent: Generation[] = defCached ? JSON.parse(defCached) : [];
          const defClean = Array.isArray(defCurrent)
            ? defCurrent.filter((g) => !["gen-1", "gen-2", "gen-3", "gen-4", "gen-5"].includes(g.id))
            : [];
          const defFiltered = defClean.filter((g) => g.id !== targetId);
          localStorage.setItem(GENERATIONS_KEY, JSON.stringify([savedGen, ...defFiltered].slice(0, 30)));
        } catch {}
      }

      window.dispatchEvent(new Event("craftai_generations_updated"));
    } catch {
      // Ignore
    }
  }

  // 2. Persist to Supabase in the background
  const supabase = createClient();
  if (supabase) {
    try {
      if (isUpdate) {
        await supabase
          .from("generations")
          .update({
            prompt: savedGen.prompt,
            image_url: savedGen.image_url,
            model: savedGen.model,
            aspect_ratio: savedGen.aspect_ratio,
            created_at: savedGen.created_at,
          })
          .eq("id", targetId);
      } else {
        await supabase.from("generations").insert([savedGen]);
      }
    } catch (e) {
      console.warn("Supabase generation save/update background notice", e);
    }
  }

  return savedGen;
}

/* ── Delete Generation from DB & Cache (Permanent & User-Scoped) ── */
export async function deleteGeneration(id: string, userIdentifier?: string): Promise<void> {
  const keysToClean = [
    getUserGenerationsKey(userIdentifier),
    GENERATIONS_KEY,
  ];

  if (typeof window !== "undefined") {
    try {
      keysToClean.forEach((key) => {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            // Remove the deleted generation AND ensure static seeds are never retained
            const filtered = parsed.filter(
              (g: Generation) => g.id !== id && !["gen-1", "gen-2", "gen-3", "gen-4", "gen-5"].includes(g.id)
            );
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      });
      window.dispatchEvent(new Event("craftai_generations_updated"));
    } catch {
      // Ignore
    }
  }

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from("generations").delete().eq("id", id);
    } catch {
      // Ignore
    }
  }
}

/* ── Fetch Single Artwork by ID ──────────────────────────────── */
export async function fetchArtworkById(id: string): Promise<Artwork | null> {
  const all = await fetchArtworks();
  return all.find((a) => a.id === id) ?? null;
}

/* ── Bookmarks / Private Saved Cache Key ─────────────────────── */
export const BOOKMARKS_KEY = "craftai_db_bookmarks_v1";

/* ── Publish Artwork to Explore Gallery & DB ─────────────────── */
export async function publishArtwork(params: {
  prompt: string;
  image_url: string;
  model?: string;
  aspect_ratio?: string;
  author_name?: string;
  author_handle?: string;
  author_avatar?: string;
}): Promise<Artwork> {
  const cleanPrompt = (params.prompt || "").trim();
  const cleanTitle = cleanPrompt.length > 36 ? `${cleanPrompt.slice(0, 36)}...` : cleanPrompt || "Studio Artwork";

  const newArt: Artwork = {
    id: `art-${Date.now()}`,
    title: cleanTitle,
    prompt: cleanPrompt,
    image_url: params.image_url,
    fallback_url: params.image_url,
    model: params.model || "FLUX.1 Schnell",
    category: "Community Creation",
    likes_count: 1,
    author_name: params.author_name || "Alex Rivera",
    author_handle: params.author_handle || "@alexrivera_ai",
    author_avatar: params.author_avatar || "AR",
    seed: Math.floor(Math.random() * 9000) + 1000,
    width: 512,
    height: 512,
    created_at: new Date().toISOString(),
  };

  // 1. Optimistically update local Explore Gallery artworks
  if (typeof window !== "undefined") {
    try {
      const current = await fetchArtworks();
      const updated = [newArt, ...current.filter((a) => a.id !== newArt.id)];
      localStorage.setItem(ARTWORKS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("craftai_artworks_updated"));
    } catch {
      // Ignore
    }
  }

  // 2. Persist to Supabase DB
  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from("artworks").insert([newArt]);
    } catch (e) {
      console.warn("Supabase publish artwork background notice", e);
    }
  }

  return newArt;
}

/* ── Save Private Artwork / Bookmark ─────────────────────────── */
export async function savePrivateArtwork(params: {
  prompt: string;
  image_url: string;
  model?: string;
  aspect_ratio?: string;
}): Promise<Generation> {
  const cleanPrompt = (params.prompt || "").trim();
  const savedItem: Generation = {
    id: `saved-${Date.now()}`,
    prompt: cleanPrompt,
    image_url: params.image_url,
    model: params.model || "Flux Schnell",
    aspect_ratio: params.aspect_ratio || "1:1",
    created_at: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const existing: Generation[] = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
      const updated = [savedItem, ...existing.filter((item) => item.image_url !== savedItem.image_url)];
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("craftai_bookmarks_updated"));
    } catch {
      // Ignore
    }
  }

  return savedItem;
}

/* ── Fetch Saved Bookmarks ───────────────────────────────────── */
export async function fetchBookmarks(): Promise<Generation[]> {
  if (typeof window !== "undefined") {
    try {
      const existing = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
      if (Array.isArray(existing) && existing.length > 0) return existing;
    } catch {
      // Ignore
    }
  }
  return [];
}

/* ── Fetch Single Generation by ID ──────────────────────────── */
export async function fetchGenerationById(
  id: string,
  userIdentifier?: string
): Promise<Generation | null> {
  const gens = await fetchGenerations(userIdentifier);
  const found = gens.find((g) => g.id === id);
  if (found) return found;
  const bookmarks = await fetchBookmarks();
  return bookmarks.find((g) => g.id === id) || null;
}

/* ── Wallet & Credits Ledger ─────────────────────────────────── */
const WALLET_KEY_PREFIX = "craftai_wallet_";

export async function fetchWallet(userIdentifier?: string): Promise<Wallet> {
  const cleanKey = getUserGenerationsKey(userIdentifier);
  const key = `${WALLET_KEY_PREFIX}${cleanKey}`;

  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          return {
            user_id: parsed.user_id || userIdentifier || "user_default",
            credits: typeof parsed.credits === "number" ? parsed.credits : 100,
            purchased_balance:
              typeof parsed.purchased_balance === "number"
                ? parsed.purchased_balance
                : 80,
            earned_royalty_balance:
              typeof parsed.earned_royalty_balance === "number"
                ? parsed.earned_royalty_balance
                : 20,
          };
        }
      }
    } catch {}
  }

  // Try Supabase wallets table if available
  const supabase = createClient();
  if (supabase && userIdentifier && !userIdentifier.includes("default")) {
    try {
      const { data } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userIdentifier)
        .single();
      if (data) {
        const resolved: Wallet = {
          user_id: data.user_id || userIdentifier || "user_default",
          credits: Number(data.credits ?? 100) || 100,
          purchased_balance: Number(data.purchased_balance ?? 80) || 80,
          earned_royalty_balance:
            Number(data.earned_royalty_balance ?? 20) || 20,
        };
        if (typeof window !== "undefined")
          localStorage.setItem(key, JSON.stringify(resolved));
        return resolved;
      }
    } catch {}
  }

  // Default initial wallet
  const defaultWallet: Wallet = {
    user_id: userIdentifier || "user_default",
    credits: 100,
    purchased_balance: 80,
    earned_royalty_balance: 20,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(defaultWallet));
  }
  return defaultWallet;
}

export async function topUpCredits(
  amount: number,
  userIdentifier?: string
): Promise<Wallet> {
  const current = await fetchWallet(userIdentifier);
  const cleanKey = getUserGenerationsKey(userIdentifier);
  const key = `${WALLET_KEY_PREFIX}${cleanKey}`;

  const updated: Wallet = {
    ...current,
    credits: current.credits + amount,
    purchased_balance: current.purchased_balance + amount,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event("craftai_wallet_updated"));
  }

  const supabase = createClient();
  if (supabase && userIdentifier && !userIdentifier.includes("default")) {
    try {
      await supabase.from("wallets").upsert(updated);
    } catch {}
  }

  return updated;
}

/**
 * 2-Credit Download Paywall Gate
 * If is_download_unlocked is true, re-download is 100% free (Idempotent).
 * If false, deducts 2 credits from wallet, marks job as unlocked, and returns true.
 */
export async function unlockGenerationDownload(
  id: string,
  userIdentifier?: string
): Promise<{ success: boolean; creditsLeft: number; wasAlreadyUnlocked: boolean }> {
  const key = getUserGenerationsKey(userIdentifier);
  const wallet = await fetchWallet(userIdentifier);

  let gen: Generation | null = null;
  let gens: Generation[] = [];

  if (typeof window !== "undefined") {
    try {
      gens = JSON.parse(localStorage.getItem(key) || "[]");
      gen = gens.find((g) => g.id === id) || null;
    } catch {}
  }

  // Idempotent: already unlocked
  if (gen?.is_download_unlocked) {
    return { success: true, creditsLeft: wallet.credits, wasAlreadyUnlocked: true };
  }

  // Check balance
  if (wallet.credits < 2) {
    return { success: false, creditsLeft: wallet.credits, wasAlreadyUnlocked: false };
  }

  // Deduct 2 credits
  const updatedWallet: Wallet = {
    ...wallet,
    credits: Math.max(0, wallet.credits - 2),
    purchased_balance: Math.max(0, wallet.purchased_balance - 2),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(`${WALLET_KEY_PREFIX}${key}`, JSON.stringify(updatedWallet));
    window.dispatchEvent(new Event("craftai_wallet_updated"));
  }

  // Mark generation as unlocked
  if (typeof window !== "undefined" && gens.length > 0) {
    const updatedGens = gens.map((g) =>
      g.id === id ? { ...g, is_download_unlocked: true } : g
    );
    localStorage.setItem(key, JSON.stringify(updatedGens));
    window.dispatchEvent(new Event("craftai_generations_updated"));
  }

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase
        .from("generations")
        .update({ is_download_unlocked: true })
        .eq("id", id);
      await supabase
        .from("jobs")
        .update({ is_download_unlocked: true })
        .eq("job_id", id);
    } catch {}
  }

  return { success: true, creditsLeft: updatedWallet.credits, wasAlreadyUnlocked: false };
}
