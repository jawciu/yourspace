# ds-structure

Rules for generative UI that does not look like slop and stays on brand every time.

Written for the Architect x Corgi designathon, Sunday. Read this file first, then `RULES.md`.

## The thesis, in one paragraph

Generative UI usually means "the model draws the screen". That version is a slot machine: it
drifts, it invents spacing and colour, and it produces a different-looking thing every run. The
version that works splits the job in two. **The model generates structure and intent. A
deterministic renderer you designed resolves everything visual.** Composition is generative.
Rendering is not. Brand consistency stops being something you ask for in a prompt and becomes
something the model cannot violate, because the schema has no field for it.

## How this repo is meant to be used

An agent picking this up cold should:

1. Read `RULES.md`. Every rule is either **mechanical** (a machine checks it, it fails hard) or
   **judgment** (a second model call checks it). Do not treat any of them as suggestions.
2. Read `spec/vocabulary.md`. That is the only vocabulary the model is allowed to emit.
3. Validate every generated plan with `validate.mjs` before rendering. A plan that fails
   validation is not rendered and not shown. It is regenerated with the error attached.
4. Read `spec/stability.md` before writing any render loop. This is the part nobody has solved
   and the part worth the day.

## Files

| File | What it is |
|---|---|
| `RULES.md` | The rule set. Mechanical and judgment, numbered. |
| `spec/ui-plan.schema.json` | The contract the model emits. JSON Schema 2020-12. |
| `spec/vocabulary.md` | Closed component vocabulary, intent classes, tiers, frames. |
| `spec/stability.md` | Diffing and persistence rules across turns. |
| `validate.mjs` | Dependency-free mechanical validator. `node validate.mjs plan.json` |
| `DEMO.md` | Sunday plan, the kill shot, and the cut list. |
| `PLAN.md` | Designathon day plan: three flows, timeline, cut list. |
| `DESIGN-BRIEF.md` | The 14 blocks to design, the tier ladder, and the house to model. |
| `research/solar-journey.md` | What to ask, how to size and price solar, image options. |
| `web/` | The app. Next.js, see `web/README.md`. |
| `data/` | Tariffs, personas, calculators (symlink into `web/data`). |

## Provenance

The structural half (atomic levels, intent categories, index-and-JSDoc context, mechanical vs
judgment rules, "conventions compiled not cultural") is adapted from Liam Cresswell's Subplane
work, which solves the same problem at build time:
https://www.youtube.com/watch?v=aAO0b21CZNA

The runtime half (tiers, scarcity, stability, trust affordances) is ours. His enforcement loop
runs in minutes against a human reviewer. Ours has to run in milliseconds in front of a user, so
the review pipeline is replaced by schema validation and a renderer that structurally cannot
express an off-brand result.
