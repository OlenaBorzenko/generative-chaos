# Implementation Plan — Live Demo Upgrade

Status: **Draft — awaiting approval. No code changed yet.**

## 1. Current Architecture (as-is)

**Backend** — `GenerativeChaos/GenerativeChaos.Api` (.NET 10, ASP.NET Core controllers)

| Piece | Role |
|---|---|
| `Controllers/GalleryController.cs` | `POST /api/Gallery` (generate), `GET /api/Gallery/similar/{input}`, `GET /api/Gallery` (page), `PUT designs/{id}`, `POST preview/{id}` |
| `Services/GalleryService.cs` (`IGalleryService`) | Orchestrates embeddings → AI config → Cosmos insert; similarity search; updates |
| `Services/SemanticKernelService.cs` | SK kernel: chat completion + embeddings (1536 dims). 2-step AI: description → config JSON |
| `Services/CosmosDbService.cs` | Cosmos CRUD + `VectorDistance` similarity query |
| `Services/FileStorageService.cs` | Blob upload of PNG previews |
| `Prompts.cs` | `DesignDescriptionPromptTemplate`, `DesignConfigurationPromptTemplate`, `DefaultConfig` |
| `Dtos/TorusConfig.cs`, `Dtos/DesignDto.cs`, `Models/Design.cs` | Config schema (config stored as JSON string in Cosmos) |
| `Options/OpenAi.cs` | `Endpoint`, `CompletionDeploymentName`, `EmbeddingDeploymentName` (values in user-secrets, not repo) |

**Frontend** — `frontend/torus-knot-visualizer` (React 19, Vite, p5 1.11, zustand, react-router)

| Piece | Role |
|---|---|
| `components/TorusCanvas.tsx` | p5 WEBGL, `ortho`, `noLoop()`. Geometry (knot path + parallel-transport rings + quads) computed once in `setup`. Emits `ringPoints/quads` for export, triggers preview upload |
| `pages/home/Home.tsx` | Prompt input, generated artwork, "Related Shapes" thumbnails |
| `pages/design/Design.tsx` | Parameter editor, Save/Reset, OBJ/FBX export |
| `pages/gallery/Gallery.tsx` | Paged grid |
| `store/useStore.ts` | Persisted store. `fetchAndSetDesigns` fires **similar + generate in parallel** (must stay unchanged) |
| `utils/*` | OBJ/FBX/SVG export, preview upload (reads `canvas#{designId}`) |

**Findings that affect the plan**

- Prompt arg key bug: config step passes `["$description"]`, template uses `{{$description}}` → description likely never reaches config prompt. Fix in WS-E.
- No JSON mode / schema enforcement / range validation. Bad JSON → exception; out-of-range values → broken shapes.
- Prompt says `twistTurns` integer, DTO is `double`. `DefaultConfig.FillColor` uses alpha `90` (invalid, should be 0–1).
- No temperature/top_p settings → repetitive output. No diversity strategy.
- Canvas draws ~16k `line()` calls per frame; fine once, too slow for 60fps orbiting → needs cached geometry.
- Preview upload reads the canvas right after first draw → camera must start at default view; preview captured before user interaction.
- API base URL `http://localhost:5018` hardcoded in 4 places. Not refactored (out of scope); new code follows same pattern.
- No test projects. Validation = builds, lint, Swagger/manual + browser smoke.

## 2. Workstreams Overview

| ID | Workstream | Layer | Parallel? | Depends on |
|---|---|---|---|---|
| WS-0 | Contracts & scaffolding | BE + FE | No — first, small | — |
| WS-A | UI/UX Cybercore redesign | FE | Yes | WS-0 |
| WS-B | Interactive 3D camera | FE | Yes | WS-0 |
| WS-C1 | Art Fusion — backend | BE | Yes | WS-0 |
| WS-C2 | Art Fusion — frontend | FE | Yes (Home wiring waits on WS-A) | WS-0, WS-C1 contract |
| WS-D | AI model research + configurable model | BE + docs | Yes | WS-0 |
| WS-E | Prompt engineering + validation | BE | Yes | WS-0 |
| WS-F | Integration, QA, docs | All | No — last | All |

```
WS-0 ──┬── WS-A ───────────┐
       ├── WS-B ───────────┤
       ├── WS-C1 ──┐       ├── WS-F
       │           └ WS-C2 ┤   (C2 Home.tsx wiring after WS-A)
       ├── WS-D ───────────┤
       └── WS-E ───────────┘
```

## 3. File Ownership Matrix (conflict control)

Rule: one owner per file. Others touch only if listed as shared, only in named region.

| File | Owner | Shared with (region) |
|---|---|---|
| `Prompts.cs` | WS-E | WS-0 adds empty `FusionPromptTemplate` stub |
| `Services/SemanticKernelService.cs` | WS-0 scaffolds | WS-D: constructor + `CreateExecutionSettings`; WS-E: `GenerateDesignConfigurationAsync`, `ParseConfig`; WS-C1: `FuseDesignConfigurationsAsync` body |
| `Services/TorusConfigValidator.cs` (new) | WS-E | WS-C1 consumes only |
| `Options/OpenAi.cs`, `appsettings*.json` | WS-D | — |
| `Controllers/GalleryController.cs`, `Services/GalleryService.cs`, `Abstractions/IGalleryService.cs`, `Models/Design.cs`, `Dtos/DesignDto.cs` | WS-C1 | WS-0 adds interface signature |
| `Dtos/FusionRequest.cs` (new) | WS-0 | — |
| `components/TorusCanvas.tsx`, `components/CameraControls.tsx` (new) | WS-B | — |
| `index.css`, `App.css`, `NavBar.*`, `pages/**/*.module.css`, `Gallery.tsx`, `Design.tsx` | WS-A | WS-0 adds tokens to `index.css` |
| `pages/home/Home.tsx` | WS-A | WS-C2: one wiring edit after WS-A merges |
| `store/useStore.ts` | WS-C2 | WS-0 adds types only |
| `components/fusion/*` (new) | WS-C2 | — |
| `docs/ai-model-recommendations.md` (new) | WS-D | — |
| `README.md` | WS-F | — |

## 4. Workstreams

### WS-0 — Contracts & Scaffolding (serial, small)

**Scope**
- `Dtos/FusionRequest.cs` → `{ string NewDesignId; List<string> SimilarDesignIds; string? Guidance }`.
- `IGalleryService.FuseDesignsAsync(FusionRequest) : Task<DesignDto>` (impl throws `NotImplementedException`).
- `SemanticKernelService` stubs: `CreateExecutionSettings(...)`, `ParseConfig(string json)`, `FuseDesignConfigurationsAsync(IReadOnlyList<Design> sources, string? guidance) : Task<(string description, TorusConfig config)>`. Existing behavior unchanged.
- `Prompts.FusionPromptTemplate` placeholder. Variable contract: `{{$sources}}` (JSON array `{userInput, description, config}`), `{{$guidance}}`.
- Frontend: `FusionRequest` type + `fusedDesign`, `fusionSelection` in store types (no logic).
- CSS design tokens in `index.css`: `--color-dominant`, `--color-secondary`, `--color-accent`, `--surface-*`, `--glow-*`, `--font-*`, `--radius-*`, `--ease-*`. WS-A may tune values, not names.

**Acceptance**: `dotnet build` ✅, `npm run build` ✅, app behaves exactly as before.
**Parallel**: No. Must merge before others start.

### WS-A — UI/UX Cybercore Redesign

**Scope**
- Palette (60/30/10 proposal):
  - 60% dominant: deep void `#0A0B14`, panel `#12142A`.
  - 30% secondary: electric indigo/violet `#3B2E7E` → `#6C4BFF` (panels, borders, glass).
  - 10% accent: neon cyan `#00F0FF` + hot magenta `#FF2E88` (CTAs, focus, active).
  - Fonts via CSS system stack (`ui-monospace` for HUD labels). No new npm deps.
- Layout: full-height studio. Canvas stage = dominant focus. Glass side panel right. Slim top nav, logo glyph, active-route indicator.
- Home: terminal-style prompt console, Ctrl/⌘+Enter submit, generating state (scanline/pulse), related shapes as cards.
- Design page: grouped params (Topology p,q / Form / Twist / Surface / Energy / Color). Sliders + number fields with schema ranges. Same data flow.
- Gallery: responsive grid, hover glow, prompt caption.
- Subtle motion: fade/slide-in, hover glow. Respect `prefers-reduced-motion`.
- Leave fusion slot in Home so WS-C2 wiring = one-line edit.

**Files**: `index.css`, `App.css`, `NavBar.tsx/.css`, `pages/*/*.module.css`, `Home.tsx`, `Design.tsx`, `Gallery.tsx`.
**Must not change**: store logic, API calls, export calls, `TorusCanvas` props.
**Acceptance**
- All routes render. Generate, adjust, save, reset, OBJ/FBX export, gallery paging work.
- Artwork = largest element on Home + Design. Palette ~60/30/10.
- `npm run build` + `npm run lint` pass (no new errors vs. baseline).
- Good at 1280×720 (projector) and 1920×1080.

**Parallel**: Yes.

### WS-B — Interactive 3D Camera

**Scope**
- Geometry functions (`computeKnotPath`, `computeRingsWithParallelTransport`, `rotateVectorAroundAxis`) frozen.
- Cache mesh once via `s.buildGeometry(() => { drawDepthFill(); drawWireframe(); })` → `s.model()` per frame. Fallback: immediate mode if strokes differ visibly.
- `s.orbitControl()` rotate/zoom/pan. Keep `ortho`; zoom via scale.
- Render on demand: `loop()` while interacting, `noLoop()` when idle.
- Preview upload + `onGenerateObj` fire after first frame at **default** view (unchanged). Exports use `ringPoints/quads` → camera-independent.
- `CameraControls.tsx` overlay inside canvas wrapper: Reset, Zoom ±, Auto-rotate toggle. Key `R` = reset.
- New optional props: `interactive?: boolean` (default `true`), `autoRotate?: boolean`.
- Wheel captured only over canvas.

**Files**: `components/TorusCanvas.tsx`, new `components/CameraControls.tsx` + `.module.css`.
**Acceptance**
- Drag rotates, wheel zooms, reset restores exact initial view.
- Preview PNG matches current default view.
- OBJ/FBX output identical for same config vs. before.
- ≥ 30 fps on default config on demo laptop.
- Live re-render on Design page edits works.

**Parallel**: Yes. No page edits needed.

### WS-C1 — Art Fusion Backend

**Scope**
- `POST /api/Gallery/fusion`, body `FusionRequest`, returns `DesignDto` (same as generate). 400 on: empty selection, > 4 sources, unknown IDs.
- `GalleryService.FuseDesignsAsync`:
  1. Load new + selected designs via `CosmosDbService.GetDesignAsync` (`Task.WhenAll`).
  2. Deserialize configs (existing pattern).
  3. `SemanticKernelService.FuseDesignConfigurationsAsync` → (description, config).
  4. Validate/repair with `TorusConfigValidator` (WS-E); fallback to new design's config if unrecoverable.
  5. Embed description (`GetEmbeddingsAsync`), persist new `Design` (`UserInput` = `"Fusion: …"`). Needed so preview upload, Adjust, Gallery work unchanged.
- Optional lineage: nullable `FusedFrom: string[]` on `Design` + `DesignDto` (backward compatible).
- Generate + similar endpoints untouched.

**Files**: `GalleryController.cs`, `GalleryService.cs`, `IGalleryService.cs`, `SemanticKernelService.cs` (Fuse body only), `Models/Design.cs`, `Dtos/DesignDto.cs`.
**Acceptance**
- Swagger: valid IDs → 200 + config in schema ranges.
- Invalid input → 400, existing error style.
- Existing endpoint responses unchanged.
- `dotnet build` 0 errors, no new warnings in touched files.

**Parallel**: Yes (uses stub validator/prompt until WS-E merges).

### WS-C2 — Art Fusion Frontend

**Scope**
- Store: `fusionSelection`, `toggleFusionSelection(id)`, `fusedDesign`, `isFusing`, `fusionError`, `fuseDesigns(guidance?)`. Reset on new generate / `clearState`. **`fetchAndSetDesigns` untouched.**
- Selectable similar cards (neon ring when selected, max 4). Separate "open" affordance keeps navigate-to-Adjust.
- `FusionPanel`: selected chips, optional guidance input, "Fuse ⚡" CTA (enabled when new design exists + ≥ 1 selected), loading animation, result via `TorusCanvas` (fused id → preview upload works), "Adjust" reuses `setSelectedDesign` + navigate.
- Home wiring: one edit after WS-A merge.

**Files**: `store/useStore.ts`, new `components/fusion/FusionPanel.tsx`, `components/fusion/SelectableDesignCard.tsx`, `*.module.css`, `Home.tsx` (wiring only).
**Acceptance**
- Generate still fires two parallel requests (Network tab).
- Select 1–4 → Fuse → fused artwork renders, orbitable, preview uploads, shows in Gallery.
- Errors inline, no crash.
- `npm run build` + lint pass.

**Parallel**: Yes for store/components (mock API). Home wiring serialized after WS-A.

### WS-D — AI Model Research + Configurable Model

**Scope**
- Research current Azure AI Foundry catalog + pricing. Write `docs/ai-model-recommendations.md`:
  - Baseline: current deployment (name in user-secrets — confirm).
  - Candidates: GPT-4.1 / 4.1-mini, GPT-5 family (5, 5-mini, newest 5.x), o-series reasoning (o4-mini or successor), any newer GA model at execution time.
  - Criteria: math/geometry reasoning, creative variety, structured outputs (JSON schema), latency, cost per 1M in/out tokens, Azure regions + deployment type, SK 1.44 compatibility.
  - Output: table + primary pick + fast demo fallback + sources.
- Configurable (no deploy, no switch):
  - `Options/OpenAi.cs` optional fields: `FusionDeploymentName`, `Temperature`, `TopP`, `MaxOutputTokens`, `ReasoningEffort`, `UseStructuredOutput`. All nullable → defaults = today's behavior.
  - `CreateExecutionSettings(...)` → `OpenAIPromptExecutionSettings`. Omit temperature/top_p for reasoning models.
  - Fusion uses `FusionDeploymentName` if set (keyed SK service), else completion deployment.
- Risk: newest-model features may need newer SK / `Azure.AI.OpenAI`. **No package bumps without approval** — list versions in doc.

**Files**: `Options/OpenAi.cs`, `SemanticKernelService.cs` (constructor + settings helper), `appsettings.json` (non-secret defaults), new `docs/ai-model-recommendations.md`.
**Acceptance**
- No new settings → identical behavior.
- Change deployment names in secrets → model switches, no code change.
- Doc: comparison table (quality/latency/cost/availability), sources, clear recommendation.

**Parallel**: Yes.

### WS-E — Prompt Engineering + Validation

**Scope**
- Fix `["$description"]` → `["description"]`.
- Description prompt → short structured brief: topology/silhouette, movement/rhythm, complexity, surface texture, energy, palette + mood.
- Config prompt:
  - Param semantics (p = lobes/windings, q = passes through hole, waveAmplitude = radial breathing, eccentricity = ribbon flattening, twist = spiral motion, lumps = beading rhythm, electricity = jitter).
  - Mood/motion → range heuristics (calm → low twist/lumps; chaotic → high q + electricity; organic → lumps + eccentricity; minimal → low detail).
  - Explicit valid coprime p<q pairs list.
  - Anti-repetition: avoid default combo (3/8 + defaults), consider variants internally, pick most distinctive that fits brief.
  - Plotter-aware wire density (pathDetail × ringDetail budget).
  - Colors: valid `rgb()` / `rgba(r,g,b,a∈0–1)`, internal 60/30/10 contrast.
- Dedicated `FusionPromptTemplate`: analyze each source's geometric signature → synthesize new (inherit topology from one, rhythm/surface from another, blend or contrast palettes) — not an average. Output `{ "description": "...", "config": {...} }`.
- Structured output (`json_object` / JSON schema) via WS-D settings when supported; fallback: extract first `{…}` block.
- New `TorusConfigValidator`: clamp ranges, p≠q prime, `twistDirection ∈ {-1,1}`, repair colors, cross-rules (knotRadius>0.9 → cap tubeRadius, etc.). Returns repaired config + fix list (logged).
- Temperature: higher for description, lower for config (via WS-D helper).
- Fix `DefaultConfig.FillColor` alpha.

**Files**: `Prompts.cs`, `SemanticKernelService.cs` (`GenerateDesignConfigurationAsync`, `ParseConfig`), new `Services/TorusConfigValidator.cs`.
**Acceptance**
- 10 sample prompts (calm ocean, storm, zen minimal, baroque, neon city, …): 10/10 parse + validate, visibly distinct (not all p=3,q=8), no degenerate-quad errors.
- `TorusConfig` schema unchanged → renderer + exports compatible.
- `dotnet build` passes.

**Parallel**: Yes.

### WS-F — Integration, QA, Docs (serial, last)

**Scope**
- Merge order: WS-0 → WS-D → WS-E → WS-C1 → WS-B → WS-A → WS-C2. Resolve `SemanticKernelService.cs` regions.
- E2E smoke (browser automation where possible):
  1. Generate → 2 parallel requests → artwork + related shapes.
  2. Orbit/zoom/reset on Home + Design.
  3. Adjust → edit → Save → Reset → OBJ + FBX download.
  4. Select similar → Fuse → render → Adjust fused → visible in Gallery.
  5. Gallery paging.
- `dotnet build GenerativeChaos/GenerativeChaos.sln`, `npm run build`, `npm run lint`.
- README: features, fusion endpoint, model config keys, demo tips.
- Final summary: changes, validation, model recommendation.

**Acceptance**: all smoke steps pass, builds green, no regressions.
**Parallel**: No.

## 5. Fleet Execution Plan

| Phase | Agents (parallel) | Gate |
|---|---|---|
| 1 | WS-0 (1 agent) | builds green, behavior unchanged |
| 2 | WS-A, WS-B, WS-C1, WS-D, WS-E, WS-C2 store/components (6 agents) | each WS acceptance |
| 3 | WS-C2 Home wiring (after WS-A + WS-C1 merged) | fusion E2E |
| 4 | WS-F (1 agent) | full smoke + docs |

Branch per workstream: `feat/demo-ws-<id>`. Small commits. Each agent runs only its own build/lint.

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| `SemanticKernelService.cs` touched by 3 WS | WS-0 scaffolds separate methods; region ownership (§3) |
| `Home.tsx` touched by WS-A + WS-C2 | WS-A leaves slot; C2 wiring after A merge |
| `buildGeometry` strokes look different | Visual diff; fallback immediate mode + on-demand redraw |
| Orbit changes preview PNG | Capture on first frame before interaction |
| New models need newer SDK | Document; ask before bump |
| Backend needs Azure creds | Smoke with dev user-secrets; agents without creds validate via build |
| Fusion latency on stage | Progress animation; fast model via `FusionDeploymentName` |

## 7. Open Questions (owner decision)

1. Persist fused designs to Cosmos/Gallery? **Proposed: yes** (needed for preview upload + Adjust).
2. Max similar designs per fusion? **Proposed: 4.**
3. Allow SK / `Azure.AI.OpenAI` version bumps if recommended model needs them? **Proposed: no, document only.**
4. Add small xUnit project for `TorusConfigValidator`? New dev dependency. **Proposed: skip unless approved.**
5. Current chat deployment name (user-secrets) — baseline for model comparison.
