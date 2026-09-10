# CraftAI Studio — Next.js 15 Web Platform

High-performance desktop creation studio and public prompt marketplace built with Next.js 15, React, TypeScript, and Supabase SSR.

## Tech Stack
- **Framework:** Next.js 15 (React 19, App Router)
- **Styling:** TailwindCSS with curated dark mode palette (`#0B0F19`, `#00F2FE`)
- **Database & Auth:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`, `pgvector`)
- **Icons:** `lucide-react`

## Features
1. **Explore & Remix Marketplace:** Server-Side Rendered (SSR) for high SEO indexability.
2. **Dual-Action Bar:** 1-Tap `Use as Prompt` (remix formula) and `Use as Ref` (image reference injection).
3. **Studio Controls:** Batch Count (1–4), Seed Lock (🔒), Aspect Ratio (Auto, 1:1, 9:16, 16:9), and 2K/4K resolution toggle.
4. **Prompt DRM & Security:** Canvas DOM rendering and right-click protection.

## Quick Start
```bash
npm install
npm run dev
```
