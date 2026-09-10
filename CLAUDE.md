# ds-structure — session journal

Rule set for generative UI that stays on brand: the model emits structure and intent (a `UIPlan`
JSON), a deterministic renderer resolves everything visual. Written for the Architect x Corgi
designathon (generative UI / intent-based interfaces). Read `README.md`, then `RULES.md`.

## Stack / commands

- Root: `node validate.mjs <plan.json>` validates a plan (dependency-free). Examples in `examples/`.
- App: `cd web && npm run dev` (Next 16, React 19, Tailwind 4, motion, @anthropic-ai/sdk, zod).
  `npx tsc --noEmit` typechecks. Fixture check: see scratch script pattern in session log.
- Root is the git repo, pushed to **https://github.com/jawciu/yourspace** (private, `main`).
  The old scaffold-only repo in `web/` was removed. `.playwright-mcp/` and `web/.env.local` are
  ignored. Caroline's rule: never commit or push unless she says, no Co-Authored-By trailers.

## Layout

`README.md` thesis + index · `RULES.md` 24 mechanical + 5 judgment rules · `spec/vocabulary.md`
closed vocabulary (empty until domain chosen) · `spec/stability.md` diff-by-block-id rules ·
`DEMO.md` build order, kill shot, cut list.

## Decision Log

- 2026-09-06 — Root (not `web/`) is the repo, so rules and app ship together. Private on GitHub.

- 2026-09-03 — Model never generates appearance; only composition. Brand is a schema constraint.
- 2026-09-03 — Stability (diff by block id, one tier of movement per turn, focus lock) is the
  bet for the day, not prettier output.
- 2026-09-03 — Vocabulary left empty on purpose; domain undecided.

## Session Log

### 2026-09-06 — Designathon day, idea generation
Caroline is at the event and asked for 10 product ideas. Constraints she gave: innovative, useful,
productisable, web-based (hosts are a new-wave web agency, "most of the internet looks the same"),
visual, not a rehash of last week's print-placement tool (`~/Code/daytona-hackathon`), possibly
ecommerce or a personal assistant that generates a flow inside the chat. Her boyfriend's BI-tool
"gen-AI charts" is the boring baseline to beat. Ideas delivered in chat.

**Decided:** the "un-landing page" idea, on a **fictional UK energy supplier** (Caroline works at
E.ON Next, so the brand is fictionalised on purpose; do not use the real name or logo). Three flows:
meter reading, solar suitability, personalised tariff switch. Always logged in, persona switcher.
Model never does arithmetic. Full plan in `PLAN.md`, data in `data/`, solar research in
`research/solar-journey.md`. Caroline is doing brand separately with a tool called Astra (unknown
to me, do not guess its API). Deadline 16:00 for build, then video and slides.

**Update 12:25 — the app is built and running.** `web/` is a Next.js app. Three flows render from
hand-written fixtures (`web/lib/fixtures.ts`, all 13 pass `validate`), the model path is wired
(`app/api/plan/route.ts`, claude-opus-5, structured output, validate, retry once, fixture fallback)
but **no ANTHROPIC_API_KEY is set yet**, so it currently runs on fixtures. Both placeholder brands
render (`volt` light, `ember` dark). Verified in Playwright: tariff turn 1 and 2 (Sam),
solar turn 1 and 2, meter (Priya) under Ember. Zero console errors. Dev server was on port 3210.

Deliverables for Caroline: `DESIGN-BRIEF.md` (14 blocks + states + tier ladder + the house to
model), `spec/vocabulary.md` (filled, generated from `web/lib/vocabulary.ts`).

Gotchas hit: turbopack refuses symlinks pointing outside the project root, so `data/` was moved
into `web/data` and the root `data/` is now the symlink. `turbopack.root` set in next.config.ts.
Node strip-types wants `.ts` extensions on relative imports but Next's tsconfig forbids them, so validate fixtures through the app, not via node directly.

Next: Caroline drops the brand tokens into `web/app/globals.css` and the house renders into
`web/public/house/`; add the API key to `web/.env.local` and try the live model on all three flows;
then record. Stretch: live image generation, pin/dismiss demo in the video.

**Update 12:50 — v2 after Caroline's feedback.** Landing is now a centred "What can we help you with
today?" prompt with three pills; after the first answer the ask box moves (shared `layoutId="ask"`,
spring) to a floating dock bottom-right with stage-aware follow-up chips and "New query". Ember is the
default brand, Red Hat Display / Text / Mono via Google Fonts link in `layout.tsx`, no cards: blocks
are separated by hairlines, the hero sits on a radial accent glow (colour as light, borrowed from the
portfolio DESIGN.md), comparison columns are hairline-divided not boxed, hints raised to 14px and
readable. Solar journey is ask-first: supplier holds usage/meters only; personas carry
`demoAnswers` (never sent to the model). Fixture stages: solar → solar:owner → solar:roof →
solar:result → solar:battery; aisha:solar:rent. New block `question.text` (free text, Enter to
submit). Shading free text is graded by `gradeShading` in data.ts. JSON rail now off by default.
Caroline asked for the /design skill: applied its craft rules (no slop tropes, bold direction,
distinctive type, no nested containers) directly in code rather than producing a separate canvas,
to protect the 16:00 deadline. Flag if she wants the canvas too.

**Update 13:05 — v3.** Two personas now, both single people: **Priya Nair** (Manchester, traditional
meters, high usage) and **Sam Okafor** (Bristol, smart meters, EV arriving, solar showcase). Aisha
removed; the renter branch survives as `sam:solar:rent` (type "I rent"). Fixture keys are `sam:*`.
House images renamed `web/public/house/sam-*.svg`. Generating state added: `Working` in page.tsx
shows flow-specific steps ("Reading your last 12 months of usage…") with a breathing accent dot;
`MIN_THINK_MS = 2600` so fixtures do not flash past it (drop it once the live model is on).
Blocks now enter staggered by tier with a blur-to-sharp spring; during a follow-up the old plan dims
to 35% under the working strip. All 7 fixture routes pass through the API.

### 2026-09-06 13:40 — PIVOT to a house design company (judge's advice)

A judge told Caroline to push for uniqueness: "design your own house". The energy supplier is gone.
**Ember is now a house design and renovation service.** One persona (Sam Okafor, just bought a 1964
detached in Bristol, into mid-century and sustainability), one journey, fixture keys:
`sam:start` (asks where to start + budget, shows what it read from the words and the listing) →
`sam:exterior` (render of the front + 3-stage plan with costs, fabric first, solar priced by the
old calculator) → `sam:living` (living room render hero, exterior steps down to primary, plan gains
a 4th stage) → `sam:living:timber` ("less orange, more timber": same block id, new variant, nothing
else moves) → `sam:saved`. Solar/EPC/pricing survive as one stage of the plan.

New blocks: `render.compare` (scene + variant + brief; static image from `RENDERS` in data.ts, or
live via `/api/render` when the variant is unknown), `plan.stages` (total computed by renderer).
Energy fixtures kept at `web/lib/fixtures.energy.ts.bak` for reference only.

**Images.** OPENAI_API_KEY copied from `~/Code/langchain-hackathon/.env` into `web/.env.local`.
Generation with `gpt-image-2` works (Images API, 1536x1024, medium, ~40s each). The edit endpoint
**rejects `input_fidelity`** on gpt-image-2, removed. Script: scratchpad `img/gen.sh` writes
`web/public/house/{exterior,living}-before.jpg`, `exterior-after.jpg`, `living-after.jpg`,
`living-after-timber.jpg`. `/api/render` edits a scene's before photo with the model's brief and
caches in memory. `PLAN.md`, `DESIGN-BRIEF.md`, `research/` still describe the energy version.

**Update 13:35 — pivot verified end to end.** All 5 renders in `web/public/house/` (real photos,
gpt-image-2: before/after exterior, before/after/timber living). Journey verified in Playwright:
landing → start → exterior → living → timber, zero console errors. Live `/api/render` verified:
an unknown brief on the exterior returned an edited image in 37s (the route file had silently
failed to write once because its directory did not exist; rewritten). Fixture routing bug fixed:
`variant` is an M2 appearance word, the prop is now `version`. Remaining: PLAN.md, DESIGN-BRIEF.md
and research/ still describe the energy version; README file table too.

### 2026-09-06 13:50 — v5: Hearth, free text, live model, memory panel, uploads

Brand is now **Hearth** (the light cream/green tokens, Red Hat fonts; Ember dark tokens deleted).
Header shows only the logo (click = new query) and "Sam Okafor · 7 Cotham Grove". Persona select,
brand toggle and JSON button removed; **Cmd+J toggles the JSON rail** for the demo.
Landing: "Let's create your perfect home!", placeholder "Explain what you'd like to achieve!",
one rotating example prompt under the box (4s, click fills the input).
**Live model is on**: ANTHROPIC_API_KEY copied from `~/Code/langchain-hackathon/.env` into
`web/.env.local` (with OPENAI). claude-opus-5, effort low, structured output, ~28-35s per plan,
passes the validator first attempt so far. Fixtures are fallback only now.
**No quiz**: `question.single` unpublished, only `question.text`. **Memory**: `memory` is now a
top-level field of the UIPlan contract (schema + validator + zod); the model returns the complete
updated list every turn; shown in a right-hand panel ("What you've told us") and fed back next turn.
**Uploads**: `photo.upload` POSTs to `/api/upload` (in-memory store, `lib/uploads.ts`), the message
quotes `photo id up_xxxx`, the model can use that id as a `render.compare` scene, `/api/render` edits
it live with gpt-image-2. Per-block error boundary + defensive props after the model once omitted
`items`. Heading rule: intent under 90 chars (validator) and prompt says 4 to 10 words.
Not yet verified in browser: an upload round-trip to a live render.

**Update 14:05 — deployed to Vercel.** `cd web && npx vercel --prod --yes` (CLI 59, account
jawciuu, project `hearth`, env vars OPENAI_API_KEY + ANTHROPIC_API_KEY set for production via
`vercel env add`). Deploys upload the working tree, no git commit needed. `vercel link` appended a
VERCEL_OIDC_TOKEN line to `web/.env.local`, harmless. Structured-output fix: block props travel as a
JSON string (`props_json`) because strict schemas turn a free-form record into `{}`; the route parses
it. Vocabulary now carries `required` props per component and the validator refuses missing ones
(M1) so the model retries with the exact field name. Uploads are serverless-safe: the client
downscales to 1536px JPEG, keeps the data URL, and sends it with `/api/render`; the in-memory store
is only a dev convenience. Verified locally: free-text kitchen conversation → photo upload → live
gpt-image-2 render of the upload, memory panel filling as the customer types.

**Production URL: https://hearth-sage-pi.vercel.app** (public). `hearth-jawciu.vercel.app` is behind
Vercel SSO, do not hand that one out. Prod render API verified (39s). Prod plan API first fell back to
fixture because the model writes ids like `action.save_plan` and the M14 regex forbade underscores;
regex loosened to allow `_` inside segments, redeployed.

### 2026-09-06 14:15 — Caroline's second feedback round, built by three parallel agents

Feedback: no persona anywhere on the hero (no "Hi Sam", no name top right); "For example" on the same
line as the rotating idea; submit is an arrow that only turns green when typing; a hero image
(`web/public/hero.png`, sketch-to-render house she supplied); the customer's typed goal sits at the top
of every screen; and the big one: **the company knows nothing about the house.** No listing, no EPC.
After the goal, the site asks ONE question per turn (grill-me style), then asks for a photo, then
renders it with costs AND a "what to buy / who to book" list whose product images are AI generated to
match the design (gpt-image-2, low quality, lazy per card). Caroline plays on prod for feedback; dev
is mine until this lands, then deploy.

Split by file ownership: Agent A page.tsx + globals.css (landing, arrow button, hero image, goal
banner, steps copy, `@import "./products.css"`). Agent B lib/* + personas.json (persona stripped to
address, one-question rule M25 in validate.ts, `products.list` in vocabulary, prompt rewrite, new
fixture chain goal→space→budget→photo→render→tweak). Agent C components/blocks/index.tsx +
app/api/product-image/route.ts + app/products.css (ProductsList with shimmer, client queue of 2).

**Update 14:30 — interview journey verified end to end in dev.** Goal → one question per turn
(space, taste, budget) → photo request → render of the uploaded photo + 3-stage costed plan +
products.list with AI-generated product images (gpt-image-2 low, ~12-18s each, 2 in flight) +
recommendation + CTA. Question turns are calm: question + one ambient note (prompt "Calm screens"
rule). Dock moved INTO the right panel (bottom, sticky), placeholder "Ask about your design", follow-up
chips removed, "Start over" button. Renderer hides the top-level `question` when a question.text or
photo.upload block exists (was duplicating). Hero image agent (checker removal + blend) in flight;
hero.css is imported from globals.css. Screens: .playwright-mcp/v7-*.png.

**Update 14:40 — third feedback round.** Goal banner bold (t3, 800). Question turn = ONE block
(prompt "Calm screens": question only, its why line is the single line above; each question gets
its own id). Keep/× tools removed from blocks. question.text: no placeholder, small Skip + Next
below the box on the right (sizes from Caroline's Figma node 3:47 via the Figma MCP: 26px tall,
4px 12px padding, 14px/600, radius 12px, in `app/buttons.css`), Skip sends "Skip that question".
Bug fixed: the second question kept the first answer because the model reused the block id and
QuestionText kept `sent` state; it now resets on question change. Deployed to prod at 14:38 (fixes
prod uploads too: the old build sent a blob: URL to /api/render). Hero: Caroline supplied a real
transparent PNG at `web/public/hero-transparent.png`; hero agent told to use it + write hero.css.

**Update 14:50.** Upload bug on Caroline's browser: the file input was `hidden` (display:none)
inside a `<label>`, which Safari will not open. Now a `div role=button` with an explicit
`inputRef.click()`, a visually-hidden input (`.vh`), a visible "Choose a photo" pill, and a
FileReader fallback when `createImageBitmap` cannot decode (HEIC). Goal quote back to t2/600,
only the "YOUR GOAL" kicker bold. Deployed.

**Update 14:58.** Upload, third attempt: the "Choose a photo" pill now has a NATIVE file input
overlaid at opacity 0 (`.drop-input`), so the click is a direct click on the input (Safari ignores
synthetic clicks on hidden inputs in some cases). Deployed. Caroline still reported "Finder doesn't
open" after the ref.click() version; likely also a stale tab, told her to hard-reload.
Agents in flight: E (inspiration uploads → references in /api/render, `progress` in contract, prompt
rule), F (progress bar UI, one-line thinking indicator, reshape banner removed).

**Update 15:10.** Upload, fourth attempt, now a PLAIN NATIVE `<input type="file">` inside a label
(styled via ::file-selector-button), no overlay, no ref click, never disabled. Brand renamed
**Yourspace** (logo `web/public/yourspace.png` 452x96 transparent, green #244d35, `app/logo.css`;
layout title). Order on a plan screen: goal quote → subtle progress bar (3px, muted) → the question.
The model's intent heading removed from the Renderer (clutter). Agents E and F landed: inspiration
uploads on the taste question (kind "inspiration", supporting) become style references sent to
/api/render as extra image[] parts; `progress {done,total,label}` in the contract; one-line thinking
indicator; reshape banner gone. Deployed.

**Update 15:20.** Verified in Caroline's own Chrome (claude-in-chrome tab): prod serves the new build
(Yourspace logo, transparent hero). Prod interview via API: 6-7s per turn. The render turn was falling
back to the scripted plan (wrong room!) because two "why" lines were 82-83 chars: M9 cap raised from
80 to 120 in validate.ts + prompt (RULES.md still says 80; deliberate tuning for the live model).
Redeployed. Playwright's MCP browser is unusable now (36 stale file-chooser modals from agents' runs);
use claude-in-chrome or a fresh session for browser checks.

**Update 15:35.** Render failures on prod were OpenAI rate limits: gpt-image-2 allows 5 input
images per minute per org, and a render with room + 4 references used all 5. Fixes: references
capped at 2, `/api/render` retries up to 3 times waiting the seconds the error names, the block shows
"The studio is busy, trying again" and re-requests after 20s (up to 3). PhotoUpload now waits for an
explicit Next after the upload (no auto-send), single native file control. Deployed. Agent G in
flight: one shared Skip/Next pair below the inspiration upload on the taste turn (composite turn via
Ctx draft).

**Update 15:40.** Bug found by Caroline: after choosing a room photo the render plan appeared to
hang (upload shown again, then "generating" later). Cause: M18 focus lock in `applyPlan` treated the
focused native file input as "still typing" and queued the plan until blur. Fix (with Agent G): lock
only for text-like inputs with a non-empty value, blur file input after selection.

**Update 15:50 — deployed.** Composite taste turn: question + optional inspiration drop + ONE
Skip/Next pair below (Ctx `draft`, `submitTurn`/`skipTurn`). Focus-lock fix live. Prod:
https://hearth-sage-pi.vercel.app. Everything Caroline asked for in rounds 1-6 is on prod.

### 16:00 — round seven, three agents
Caroline: (1) room-photo turn: Next OUTSIDE the upload box, bottom right (Agent H: PhotoUpload
records draft, Renderer renders `.turn-actions` Next on room-photo turns); (2) render wait must feel
alive (Agent I: CSS-only in `app/render-wait.css`, light sweep, breathing blur, scan line, pulsing
caption, reduced-motion safe); (3) right panel shows thumbnails of uploads instead of ids (Agent J:
page.tsx + `app/memo.css`, `uploadedPreviews` from blocks, hides "photo uploaded" memory rows).
Imports for the two new css files are already in globals.css.

**16:10 — deployed round seven.** Next outside the upload box (Renderer `.turn-actions` on room-photo
turns), alive render-wait animation (`app/render-wait.css`), upload thumbnails in the right panel
(`app/memo.css`). Removed the artificial 2.6s `MIN_THINK_MS` floor (was for fixtures). Remaining
latency is the plan call itself: claude-opus-5 at effort low, 6-25s per turn; `PLAN_MODEL`
env var can switch to claude-sonnet-5 for roughly half that if Caroline wants.

**16:20.** Plan model switched to **claude-sonnet-5** (`PLAN_MODEL` env on Vercel production and in
`web/.env.local`), same images (gpt-image-2), same validator. Caroline asked why questions feel the
same: the interviewer rules converge by design; suggested a prompt tweak (react to the last answer,
vary order) rather than any JSON change.

**16:35 — questions now come from the goal.** Caroline is demoing two journeys to the judges: a
kitchen renovation and solar panels on a newly bought old house. The solar journey was asking the
kitchen script (style, inspiration photo). Fix in `web/lib/prompt.ts` only: the interview list is
derived from the goal (room redesign: space/bother/taste/budget/room photo; energy or solar:
roof orientation and shading, roof type and age, heating, usage and EV, front-of-house photo
from the street; anything else: invent the equivalent list, never taste unless the goal is about
looks). Style questions and the inspiration upload are banned on energy journeys. Each question
must react to the last answer; block ids and progress labels follow the goal ("Your roof").
Solar render brief = same house, panels on the named slope; products = panels, inverter, battery,
installer. Verified live: solar run asks roof → roof type → heating → usage → front photo; kitchen
unchanged. Deployed 16:33, committed as 50a910b (prompt.ts only; page.tsx, Ctx.tsx,
blocks/index.tsx from round seven are still uncommitted but already on prod). Untested: solar
render turn with a real house photo; any third goal (extension, garden).

### 2026-09-10 — README for GitHub
Caroline asked for a proper README on the GitHub repo (she thought it was called "Myspace", it
is **jawciu/yourspace**). Wrote `README.md` (what it is, the journey, the UIPlan idea with a JSON
excerpt, run instructions, layout table, how the day went, Subplane credit) in her voice
(sentence case, no em dashes, British spelling). Rewrote `web/README.md` (was still "Volt",
energy supplier) as a file map. `web/.env.local.example` now lists OPENAI_API_KEY too.
Screenshots in `docs/` (landing, question, plan) taken fresh from prod in her Chrome: the older
`.playwright-mcp/` shots still show the Hearth brand. Full-page shot was stitched from three
viewport captures with the sticky aside set to static first (Playwright MCP was locked by
another session). Committed 6c66ef8 and pushed on her say-so; also set the GitHub repo
description and homepage via `gh repo edit`. Still stale: PLAN.md, DESIGN-BRIEF.md and
research/ describe the energy version (README now says so).
