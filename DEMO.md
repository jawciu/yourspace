# Sunday

## What to build

**One narrow domain where intent genuinely varies.** Not an engine. Not a framework. The
temptation on the day will be to build something general, and general is what produces slop.

Pick a domain where three different users want three genuinely different screens, and where you
can tell at a glance whether the answer was right. Flat hunting, trip planning, a shift rota,
picking a fabric. Something with real constraints that trade off against each other.

## The kill shot, in order of how well it lands

**1. Same plan, two brands.** Render one generated `UIPlan` side by side under two different
token sets. Identical structure, two completely on-brand results, and the JSON visible between
them. This is thirty seconds and it proves the whole thesis: the model never touched appearance,
so it cannot get appearance wrong.

**2. Show it be wrong, then corrected.** Ask for something ambiguous. Let it guess. Dismiss the
block it got wrong, pin the one it got right, ask again. The screen adjusts around the pin
without reshuffling. This lands harder than a lucky perfect first answer, because everyone in
the room has watched a demo where the model happened to nail it and learned nothing.

**3. Three intents, one system.** Three genuinely different asks producing three genuinely
different screens that obviously belong to the same product.

## The thing to say out loud

"The model doesn't design the screen. It decides what's on it and why. Everything you can see
was designed once, by me."

And when someone asks how you keep it on brand: it isn't a prompt. The schema has no field for
colour.

Do not use the phrase "generative UI" more than once. Show the two brand renders and let the
contrast explain it.

## Build order

| # | Thing | Cut it? |
|---|---|---|
| 1 | The schema and `validate.mjs`, wired so nothing renders unvalidated | never |
| 2 | Ten to fifteen components, filled into `spec/vocabulary.md` with the when-not-to-use field | never |
| 3 | The tier ladder in the renderer, one mapping, applied everywhere | never |
| 4 | Two token sets | never, this is the kill shot |
| 5 | Diff by id, with the do-nothing case correct | this is the interesting one |
| 6 | Pin and dismiss | keep, it is the trust story and it is cheap |
| 7 | The half rule, focus lock | first to cut |
| 8 | Judgment rules, the critic pass | second to cut, and probably will be |

## Traps

- **Building an engine.** If you are adding a fifth frame or a twentieth component, stop.
- **Free-form JSX.** It is faster to get running on hour one and it is why every other team's
  output will look like a bootstrap template. Do not.
- **One-turn demos.** The stability work only shows its value on turn three. Rehearse a
  three-turn conversation, not a single prompt.
- **A dashboard.** If the output is a grid of equal cards you shipped the hedge (J3).
- **Prompting your way out of a bad component.** Unpublish it instead.

## Judging surface

Whatever the criteria turn out to be, the two things that separate this from a v0 demo are:
nothing on screen was chosen by the model, and the interface does not reassemble itself. Make
both visible rather than explaining them.
