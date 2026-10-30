# CraftAI Studio — Web & Backend API Integration Audit & Implementation Plan

> **Date:** October 30, 2026  
> **Status:** Architecture Blueprint & Actionable Implementation Plan  
> **Target Framework:** Next.js 16 Web (React 19, TypeScript) ↔ FastAPI Backend (Python 3.11+) & Supabase PostgreSQL  
> **Mobile Reference:** Flutter Mobile App (`craftai_studio_mobile`)  

---

## 1. Executive Verdict & Summary

### Verdict
The backend specification (`craftai_studio_backend` v2.1.0) and mobile app (`craftai_studio_mobile`) are mature, clean, and production-tested. The Web frontend (`craftai_studio_web`) has a strong foundation with core generation dispatch and prompt engineering partially hooked up, but **suffers from critical synchronization gaps, missing APIs, parameter casing mismatches, and severe fragmentation in design tokens**.

### Key Findings Summary
1. **Missing Endpoints in Web Frontend:**
   - **Magic Object Eraser (`POST /api/v1/tools/remove-object`):** Completely missing in Web client and UI.
   - **Vintage Photo Colorizer (`POST /api/v1/tools/colorize`):** Completely missing in Web client and UI.
   - **Multimodal Aesthetic Vision Scanner (`POST /api/v1/vision-scan`):** Completely missing in Web client and UI.
   - **Collections & Bookmarks API (`GET /api/v1/collections`, `POST /api/v1/collections/items/toggle`):** Web currently uses isolated `localStorage` rather than the unified Supabase `collections` and `collection_items` tables.
   - **Universal Search API (`GET /api/v1/search`):** Web currently uses client-side text filtering rather than the backend GIN full-text and pgvector neural search endpoint.

2. **Crucial API & Payload Discrepancies:**
   - **CamelCase vs. Snake_case Mismatches:** `toolsApi.ts` sends `imageUrl` to `/remove-background` and `/ai-background`, whereas FastAPI expects `image_url`. This triggers HTTP 422 Unprocessable Entity errors.
   - **Port Configuration Hazard:** `toolsApi.ts` had fallback port `8001`, which is the isolated PyTorch Diffusion Sidecar worker, NOT the FastAPI API Gateway (`8000`). All tool requests must target port `8000` (`/api/v1/prompt-engineering/tools/*` or `/api/v1/tools/*`).
   - **Direct Table Updates vs. Atomic RPCs:** Web currently attempts direct upserts on `wallets` or local storage deductions. In production, Supabase RLS policies block client `UPDATE` on `wallets`. All credit debits and refunds must call `client.rpc('deduct_user_credits', ...)` and `client.rpc('refund_user_credits', ...)`.

3. **Theme & Color Schema Fragility (High Priority):**
   - The web app currently has **no unified Design System Guard**.
   - Every single page (`studio/page.tsx`, `explore/page.tsx`, `library/page.tsx`, `library/[jobId]/page.tsx`, `wallet/page.tsx`, `tools/page.tsx`) defines its own local, duplicated `const S = { ... }` object with hardcoded hex codes.
   - A single color change currently requires modifying dozens of files and hundreds of inline style declarations.
   - A centralized **Theme Guard** (`themeGuard.ts` + synced CSS variables) must be established as the single source of truth.

---

## 2. Comprehensive Endpoint Synchronization Matrix

| Endpoint | Backend Route | Mobile Status | Web Client Status | Web UI Status | Verdict / Required Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Visual Gen Dispatch** | `POST /generation/dispatch` | Fully Synced | Implemented | Implemented | Verify `structured_metadata` and `remixed_from_prompt_id` are passed. |
| **WebSocket Progress** | `ws://.../ws/generation/{id}` | Fully Synced | Implemented | Implemented | Ensure polling fallback is active if WS disconnects. |
| **HTTP Status Poll** | `GET /status/{task_id}` | Fully Synced | Implemented | Implemented | Fully functional. |
| **Multi-LLM Config** | `GET /config` | Fully Synced | Implemented | Implemented | Working via `LLMConfigContext` (60s cache). |
| **Prompt Expand** | `POST /expand` | Fully Synced | Implemented | Implemented | Fully functional. |
| **Prompt Chat Copilot** | `POST /chat-delta` | Fully Synced | Implemented | Implemented | Ensure `session_id` is stable per Studio session. |
| **Background Remover** | `POST /tools/remove-background` | Fully Synced | Parameter Bug | Implemented | **Fix:** Change `imageUrl` to `image_url` in payload. |
| **Super-Res Upscaler** | `POST /tools/upscale` | Fully Synced | Implemented | Implemented | Fully functional. |
| **Background Inpaint** | `POST /tools/ai-background` | Fully Synced | Parameter Bug | Implemented | **Fix:** Ensure snake_case `image_url`, `custom_backdrop`. |
| **Canvas Expansion** | `POST /tools/ai-expand` | Fully Synced | Parameter Bug | Implemented | **Fix:** Ensure snake_case `image_url`, `target_ratio`. |
| **Product Detail** | `POST /tools/product-detail` | Fully Synced | Parameter Bug | Implemented | **Fix:** Ensure snake_case `image_url`, `product_name`. |
| **Marketing Poster** | `POST /tools/marketing-poster` | Fully Synced | Parameter Bug | Implemented | **Fix:** Ensure snake_case `image_url`, `aspect_ratio`. |
| **Tool Presets** | `POST /tools/edit-preset` | Fully Synced | Implemented | Implemented | Fully functional. |
| **Magic Object Eraser** | `POST /tools/remove-object` | Fully Synced | **MISSING** | **MISSING** | **Implement:** HTML5 Canvas drawing, base64 mask export, API client & UI. |
| **Vintage Colorizer** | `POST /tools/colorize` | Fully Synced | **MISSING** | **MISSING** | **Implement:** Saturation presets, split before/after viewer, API client & UI. |
| **Vision Scanner** | `POST /vision-scan` | Fully Synced | **MISSING** | **MISSING** | **Implement:** Reverse-engineer reference image styles in Studio & Tools. |
| **Ephemeral Face-Lock** | `POST /upload-reference` | Fully Synced | Implemented | Implemented | Working. Auto-purges in 30s. |
| **Session Signout** | `POST /auth/signout` | Fully Synced | Implemented | Implemented | Working via `UserContext`. |
| **Collections List** | `GET /collections` | Fully Synced | **MISSING** | LocalStorage only | **Implement:** Supabase DB helper & API client to query `collections`. |
| **Toggle Bookmark** | `POST /collections/items/toggle` | Fully Synced | **MISSING** | LocalStorage only | **Implement:** Polymorphic bookmarking for `jobs` & `explore_prompts`. |
| **Universal Search** | `GET /search` | Fully Synced | **MISSING** | Filter only | **Implement:** Debounced API search on Explore and Library pages. |
| **Atomic Credit Deduct** | RPC `deduct_user_credits` | Fully Synced | **MISSING** | Client-side only | **Implement:** Call atomic Supabase RPC to prevent client tampering. |
| **Atomic Credit Refund** | RPC `refund_user_credits` | Fully Synced | **MISSING** | Client-side only | **Implement:** Call atomic Supabase RPC on generation failures. |

---

## 3. Flaws & Modifications Required (Detailed Analysis)

### Flaw 1: Parameter Casing Mismatches (Frontend ↔ FastAPI)
- **Problem:** In `src/lib/api/toolsApi.ts`, payload objects pass JavaScript camelCase properties (e.g., `imageUrl`, `customBackdrop`, `aspectRatio`, `productName`). FastAPI's Pydantic schemas validate against snake_case (`image_url`, `custom_backdrop`, `aspect_ratio`, `product_name`).
- **Impact:** Requests can fail with HTTP 422 `ValidationError: Invalid field 'body -> image_url': Field required`.
- **Modification Required:** Create a request normalizer in `toolsApi.ts` and `backend-client.ts` that automatically formats all outgoing request payloads to snake_case while maintaining backwards-compatible TypeScript interfaces.

### Flaw 2: Port & Tunnel Configuration Inconsistencies
- **Problem:** `src/lib/api/toolsApi.ts` defaulted to port `8001`, which is the PyTorch sidecar microservice, while `backend-client.ts` pointed to port `8000`. In `.env.local`, `NEXT_PUBLIC_BACKEND_URL` is set to an ngrok tunnel.
- **Modification Required:** Unify all API clients to resolve from a single base URL constant `NEXT_PUBLIC_BACKEND_URL` (defaulting to `http://127.0.0.1:8000/api/v1` or `http://192.168.29.26:8000/api/v1`), and ensure all requests append both `ngrok-skip-browser-warning: true` and `Bypass-Tunnel-Reminder: true`.

### Flaw 3: Insecure Client-Side Wallet Deduction & RLS Lockouts
- **Problem:** `src/lib/supabase/db.ts` attempts to perform `supabase.from("wallets").upsert(updated)`. Under production Supabase RLS, `wallets` table writes are restricted to `service_role`.
- **Modification Required:** Replace direct wallet writes with atomic database stored procedures:
  ```typescript
  const { data, error } = await supabase.rpc('deduct_user_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_task_id: taskId,
    p_reason: reason,
  });
  ```

### Flaw 4: Missing Magic Object Eraser & Vintage Photo Colorizer
- **Problem:** Two of the platform's flagship sub-second tools (LaMa neural inpainting and DDColor neural restoration) exist on the backend and mobile app, but are missing from the web interface.
- **Modification Required:**
  1. Add `eraseObject(imageUrl, maskBase64)` and `colorizePhoto(imageUrl, saturation)` to `toolsApi.ts`.
  2. Implement `MagicObjectEraser.tsx` with an HTML5 gesture canvas that outputs a `#000000` background and `#FFFFFF` mask paths.
  3. Implement `PhotoColorizer.tsx` with saturation presets (`0.8x`, `1.0x`, `1.2x ★`, `1.4x`) and an interactive split comparison slider.
  4. Integrate both tools into `src/app/tools/page.tsx` tabs (`"object_eraser"` and `"colorizer"`).

### Flaw 5: Missing Multimodal Aesthetic Vision Scanner
- **Problem:** The backend supports reverse-engineering aesthetic prompts, style tags, and camera optics via `POST /api/v1/vision-scan`. Studio currently has no way to invoke this when a user drops a reference image.
- **Modification Required:**
  1. Add `scanAestheticVision(imageUrl: string)` in `backend-client.ts`.
  2. In `src/app/studio/page.tsx`, add an **"Aesthetic Vision Scan"** action button beside reference image slots. When clicked, it automatically populates the prompt box with the reverse-engineered visual recipe.

### Flaw 6: Bookmark Collections Disconnected from Supabase
- **Problem:** `fetchBookmarks()` in `src/lib/supabase/db.ts` reads from `localStorage`. The backend database has full `collections` and `collection_items` tables with counter-cache triggers.
- **Modification Required:** Connect collection creation, folder listing, and item toggling directly to Supabase and `/api/v1/collections`, with graceful offline fallback to `localStorage`.

---

## 4. Theme & Color Schema Guard Architecture

### Requirement
"There should be a design or color schema guard like if we want to change the theme of the system then we just change color templates in that file and whole website color or design schema will get changed accordingly, and every single button, single element, and every small button no matter on which screen it is should be accurately linked or synced to each other."

### Architecture Blueprint

#### 1. The Single Source of Truth: `src/lib/theme/themeGuard.ts`
All design tokens (colors, gradients, shadows, borders, radii, fonts) are defined in one central configuration file:

```typescript
export interface ThemeColorSchema {
  primary: string;           // Primary action buttons, active tabs, magic enhance highlights (#6366F1)
  primaryDark: string;       // Hover and active states for primary actions (#4F46E5)
  primaryGlow: string;       // Primary button glow & focus rings
  surface: string;           // Main card backgrounds, modal sheets, studio canvas (#121218)
  surfaceLight: string;      // Input fields, secondary cards, pill badges (#1E1E2A)
  surfaceHover: string;      // Card hover background (#1A1A24)
  background: string;        // Deep dark root background (#0B0B0F)
  border: string;            // Card borders, dividers, outlines (#2E2E3E)
  borderLight: string;       // Subtle borders and dividers (#1E1E2A)
  textPrimary: string;       // Main headings, active inputs (#FFFFFF)
  textSecondary: string;     // Subtitles, helper text, inactive chips (#94A3B8)
  textMuted: string;         // Timestamps, counters, placeholder text (#64748B)
  accentSuccess: string;     // Unlocked downloads, face-lock active, credits refund (#10B981)
  accentWarning: string;     // Low credits warning, disarmed status (#F59E0B)
  accentError: string;       // Server error sheets, validation errors, liked heart (#EF4444)
  copilotAccent: string;     // Prompt Chat Copilot icon and badges (#38BDF8)
  purpleAccent: string;      // Subject Lock action icon and badges (#A855F7)
}
```

#### 2. Synchronized Injection to CSS Variables (`src/app/globals.css`)
The Theme Guard injects these values directly into CSS root variables:
- `--theme-primary: #6366f1;`
- `--theme-primary-dark: #4f46e5;`
- `--theme-surface: #121218;`
- `--theme-surface-light: #1e1e2a;`
- `--theme-background: #0b0b0f;`
- `--theme-border: #2e2e3e;`
- `--theme-text-primary: #ffffff;`
- `--theme-text-secondary: #94a3b8;`
- `--theme-text-muted: #64748b;`
- `--theme-success: #10b981;`
- `--theme-warning: #f59e0b;`
- `--theme-error: #ef4444;`
- `--theme-copilot: #38bdf8;`
- `--theme-purple: #a855f7;`

#### 3. Standardized Component Guard Utilities
Instead of writing ad-hoc inline styles like `background: "#121218"`, every element uses standard design tokens from the theme guard:
1. **Via CSS Classes:**
   - `.theme-btn-primary`: Primary CTA button with hover/active transitions.
   - `.theme-btn-secondary`: Outlined/ghost button.
   - `.theme-card`: Standard card with surface background, border, and hover glow.
   - `.theme-input`: Standard input field with surface light background and focus border.
   - `.theme-pill`: Status badges and model selector chips.
2. **Via TypeScript Guard Object `theme.colors`:**
   - Replaces all local `const S = { ... }` declarations across `studio`, `explore`, `library`, `wallet`, `tools`, and `profile` pages.
   - Changing a single hex code in `themeGuard.ts` immediately updates all buttons, cards, borders, text, and modals across every screen.

---

## 5. Step-by-Step Implementation Plan

### Phase 1: Establish the Theme & Design Schema Guard
1. **Create `src/lib/theme/themeGuard.ts`:**
   - Define `defaultDarkTheme` matching specification Section 5.1 (`#6366F1`, `#121218`, `#0B0B0F`, etc.).
   - Support theme presets (`dark`, `cyberpunk`, `neon`, `light`) for instant system-wide reskinning.
   - Export typed helper functions and CSS variable injector.
2. **Update `src/app/globals.css`:**
   - Bind all `:root` CSS variables to the Theme Guard tokens.
   - Create standardized utility classes (`.theme-btn-primary`, `.theme-card`, `.theme-input`, `.theme-badge`).
3. **Refactor All Pages to Use `theme.colors`:**
   - Replace local `const S = { ... }` in:
     - `src/app/studio/page.tsx`
     - `src/app/explore/page.tsx`
     - `src/app/library/page.tsx`
     - `src/app/library/[jobId]/page.tsx`
     - `src/app/wallet/page.tsx`
     - `src/app/tools/page.tsx`
     - `src/components/layout/TopBar.tsx`
     - `src/components/layout/AppDrawer.tsx`
     - `src/components/studio/PromptInspectorModal.tsx`
     - `src/components/tools/ToolHistoryModal.tsx`

### Phase 2: API Client & Backend Harmonization
1. **Normalize Payload Parameter Casing:**
   - Update `src/lib/api/toolsApi.ts` to convert all outgoing payloads to snake_case (`image_url`, `custom_backdrop`, `target_ratio`, `product_name`, `scale_factor`).
   - Fix API base URL to ensure all requests route to FastAPI Gateway (Port 8000), not the Sidecar (Port 8001).
   - Ensure headers include both `Bypass-Tunnel-Reminder: true` and `ngrok-skip-browser-warning: true`.
2. **Implement Missing Backend Endpoints in `src/lib/api/toolsApi.ts`:**
   - `eraseObject({ image_url, mask_base64 })`
   - `colorizePhoto({ image_url, saturation })`
3. **Implement Vision Scanner in `src/lib/api/backend-client.ts`:**
   - `scanAestheticVision(imageUrl: string): Promise<VisionScanResponse>`
4. **Implement Collections & Search Endpoints:**
   - `fetchCollections()`, `toggleCollectionItem()`, `universalSearch(query, category)`

### Phase 3: Build Missing Creative Tools UI Components
1. **Create `src/components/tools/MagicObjectEraser.tsx`:**
   - Responsive HTML5 `<canvas>` rendering target image with touch and mouse drag handlers.
   - Neon violet brush path rendering with adjustable brush diameter (`10px` - `80px`).
   - Undo/Redo stroke path stack and Clear Mask button.
   - Offscreen canvas mask generator exporting solid black `#000000` base with white `#FFFFFF` erased areas.
   - Split before/after comparison slider with draggable vertical divider.
2. **Create `src/components/tools/PhotoColorizer.tsx`:**
   - B&W photo upload container.
   - Saturation selector pills (`0.8x Muted`, `1.0x Natural`, `1.2x Rich ★`, `1.4x Vibrant`).
   - Split before/after comparison slider.
3. **Integrate into `src/app/tools/page.tsx`:**
   - Add `"object_eraser"` and `"colorizer"` tabs to the tools navigation bar.

### Phase 4: Studio & Vision Scanner Parity
1. **Studio Aesthetic Vision Scanner Integration:**
   - Add a 1-tap "Scan Aesthetic" button on reference image chips.
   - Clicking it calls `scanAestheticVision` and populates the prompt box with extracted camera optics, lighting, and style tags.
2. **DRM & Secret Formula Guard Verification:**
   - Verify that Explore cards and public modals never render raw 700+ character master prompts, only `masked_summary`.
   - Verify that remixing passes `remixed_from_prompt_id` to `/generation/dispatch`.

### Phase 5: Supabase Atomic Ledger & Database Synchronization
1. **Implement Supabase RPC Calls in `src/lib/supabase/db.ts`:**
   - Replace client-side wallet updates with `client.rpc('deduct_user_credits')` and `client.rpc('refund_user_credits')`.
2. **Connect Collections & Bookmark Sync:**
   - Wire `collections` and `collection_items` tables to Library and Explore bookmark actions.

---

## 6. Future-Proof Verification Checklist

- [ ] All 10 backend tools endpoints accessible from Web with zero 422 validation errors.
- [ ] Theme change in `themeGuard.ts` instantly recolors the entire application without breaking layouts.
- [ ] Magic Object Eraser successfully creates white-on-black mask and in-paints in sub-second latency.
- [ ] Vintage Photo Colorizer restores B&W photos with adjustable saturation.
- [ ] Vision Scanner accurately reverse-engineers reference images in Studio.
- [ ] Wallet balance deductions occur authoritatively through PostgreSQL RPC.
- [ ] No git commit or push is performed until explicitly directed by the user.
