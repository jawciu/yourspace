# Volt (placeholder name)

An energy supplier website that assembles itself around what the customer came to do.

```
npm install
cp .env.local.example .env.local   # add ANTHROPIC_API_KEY, or skip it to run on fixtures
npm run dev
```

- `lib/vocabulary.ts` the closed component vocabulary. Validator, prompt and renderer all read it.
- `lib/validate.ts` the mechanical rules (M-rules from ../RULES.md). Nothing renders unvalidated.
- `lib/data.ts` personas, tariffs, the cost and solar calculators. The model never does arithmetic.
- `lib/fixtures.ts` hand-written plans. Fallback when there is no key or the model fails twice.
- `lib/prompt.ts` system and user prompts.
- `app/api/plan/route.ts` one model call, structured output, validate, retry once, fall back.
- `components/Renderer.tsx` tier ladder, diff by id, pin/dismiss, focus lock, reshape banner.
- `components/blocks/index.tsx` the 14 components.
- `app/globals.css` tokens for both brands and every block style. The only place appearance lives.
- `data/` is the real data folder; `../data` at the repo root is a symlink to it.
