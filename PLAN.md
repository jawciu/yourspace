# Build plan, designathon day (2026-09-06)

Fictional UK energy supplier (brand name TBC, "VOLT" placeholder in data). Three flows, one
renderer, one schema. Done by 16:00 for video and slides.

## Decisions already made

- **Logged in, always.** The demo is the site that knows you. A persona switcher lives in a corner
  (Priya / Sam / Aisha). No login screen, no auth, out of scope.
- **The model never does arithmetic.** Tariff costs come from `data/estimate.mjs`, solar numbers
  from the formula in `research/solar-journey.md` (to be added to the same file). The model
  chooses blocks and writes the explanation around numbers it is handed.
- **Meter reading is not one field.** Its shape comes from the account: Priya (two traditional
  meters, estimated since August) gets two fields plus a "your last reading was" hint. Aisha gets
  one field. Sam get "we read it at 06:00 today, nothing to do", one line. That is the
  demo: same request, three shapes, none of them a form the user did not need.
- **Solar image is pre-generated** for the demo house. Live generation is stretch, see research doc.
- **Fictional brand.** Not the employer's name or logo, anywhere, including the video.

## The three flows and their second turns

| Flow | Persona | First turn | Second turn (stability demo) |
|---|---|---|---|
| Meter reading | Priya | two fields, last readings, submit | "the gas one is a bit blurry, here's a photo" -> gas field swaps to photo confirm, elec field does not move |
| Solar | Sam | three questions, then render + stats + recommendation + book survey | "we're getting a battery anyway" -> stats and recommendation update in place, render and CTA stay |
| Tariff | Sam | personalised comparison, Drive wins by £480, one honest caveat | "what if we don't charge overnight" -> saving recalculated, Drive drops below Tracker, rows reorder, nothing else moves |
| Tariff, honest branch | Aisha | "you're already on the cheapest deal, fixed until March" plus a reminder toggle | none needed, it is the contrast |

## Timeline

| Time | Do | Output |
|---|---|---|
| now to 12:30 | Fill `spec/vocabulary.md` with the blocks listed at the bottom of the research doc plus meter and tariff blocks. Wire persona JSON into the app state. | vocabulary done, personas load |
| 12:30 to 13:30 | Renderer: every block as a component in the brand. Drive it with three **hand-written** plans, one per flow, no model yet. | three static pages that look finished |
| 13:30 to 14:00 | Model call: prompt = vocabulary + persona + computed numbers + user message, output = UIPlan, run through `validate.mjs`, regenerate on failure with the error attached. | live first turns |
| 14:00 to 15:00 | Stability: second turn diffs by block id, only touched blocks re-render, focus lock on the field being typed in. This is the kill shot. | live second turns |
| 15:00 to 16:00 | Polish, persona switcher, record the sequence: Priya meter reading, Sam solar, Sam tariff, Aisha tariff. Buffer. | video material |

## Cut list, in order

1. Live image generation (already cut to pre-generated)
2. Tracker tariff (keep Fixed 12, Fixed 24, Drive, SVT)
3. Meter reading photo second turn
4. Aisha entirely (lose the honest branch, keep two personas)

## Files

- `data/tariffs.json` six tariffs anchored to the Oct 2026 cap
- `data/personas.json` three logged-in customers with meters, usage, roof
- `data/estimate.mjs` deterministic tariff comparison, `node data/estimate.mjs` prints the table
- `research/solar-journey.md` questions, sizing, pricing, payback formula, image-gen options
