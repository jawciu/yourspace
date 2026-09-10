# Yourspace, the app

Next.js 16, React 19, Tailwind 4, motion. Plans from Claude via `@anthropic-ai/sdk` with zod
structured output. Images from OpenAI `gpt-image-2`. Deployed with `npx vercel --prod`.

```
npm install
cp .env.local.example .env.local
npm run dev
```

## File map

- `lib/vocabulary.ts` the closed component vocabulary. Validator, prompt and renderer all read it.
- `lib/validate.ts` the mechanical rules (M-rules from `../RULES.md`). Nothing renders unvalidated.
- `lib/schema.ts` the zod shape of a `UIPlan`, used for structured output.
- `lib/prompt.ts` system and user prompts. The interview questions are derived from the goal here.
- `lib/fixtures.ts` hand-written plans. Fallback when there is no key or the model fails twice.
- `lib/data.ts` the persona, the static renders, and the cost arithmetic. The model never adds up.
- `lib/uploads.ts` in-memory upload store for local dev. In production the client keeps the data URL.
- `app/api/plan/route.ts` one model call, structured output, validate, retry once, fall back.
- `app/api/render/route.ts` edits a room photo with the model's brief. Retries on rate limits.
- `app/api/product-image/route.ts` one generated picture per product card, low quality, cached.
- `app/api/upload/route.ts` dev-only upload endpoint.
- `components/Renderer.tsx` tier ladder, diff by id, focus lock, one question per turn.
- `components/Ctx.tsx` the turn state: draft answer, uploads, submit and skip.
- `components/blocks/index.tsx` the components, one per vocabulary entry.
- `app/globals.css` and the other css files: tokens and every block style. The only place appearance lives.
- `data/` is the real data folder; `../data` at the repo root is a symlink to it.
