# Rules

Two kinds.

- **M rules are mechanical.** Code checks them. Break one and the screen never renders.
- **J rules are judgment calls.** They need a second opinion from a model, because they catch the
  things that are technically fine and still look like slop.

If Sunday gets tight, ship every M rule and skip the J rules. The M rules are the guarantees.
The J rules are taste.

---

## A. Brand. The model never touches how anything looks.

**M1. The model describes the screen. It does not draw it.**
It hands back a plain list: what's on screen, what each thing is for, and how important it is.
No HTML, no CSS, no components. If it isn't in the list, it doesn't exist.

**M2. It can't name a colour, a size, or a spacing value.**
Not because we asked it not to. Because there's nowhere to put one. Any prop that sounds like
appearance gets rejected before it reaches the screen.

**M3. Everything visible comes from your tokens.**
If something on screen can't be traced back to a token, that's a bug in your renderer, not a
setting for the model.

**M4. The same description, two brands, two good-looking screens.**
This is a test you can actually run, and it's the demo. See `DEMO.md`.

---

## B. Scarcity. Don't let it hedge.

**M5. Five things on screen, maximum.**
When a model shows you six, it isn't being generous. It's covering itself because it doesn't
know which one you wanted.

**M6. Exactly one thing is the main thing.**
Not zero. Not two. Something has to be the answer.

**M7. At most one thing in second place.**

**M8. One primary action, and it has to point at something real.**
A button that refers to a block that isn't there is the classic failure and it's easy to catch.

**M9. Every element has to justify itself in under 80 characters.**
Written for the person using it, not for the system. If the model can't say why something is
there in one short line, it's guessing, and you cut it.

**J1. When it isn't sure, it asks. It does not lay out options.**
This is the important one. Four choices on screen looks like helpfulness and is actually the
model passing its uncertainty to you. One question beats four guesses.

**J2. Nothing is on screen "just in case".**
"Might be useful" means it goes.

**J3. It should end up with less interface than the old static version, not more.**
If what comes out looks like a dashboard, the model hedged and you're about to ship the hedge.

---

## C. Hierarchy. You design the ladder once.

**M10. Every element says where it sits: hero, primary, supporting, or ambient.**
The model says what matters most. It does not get to say how big anything is. You decided that
already.

**M11. What each rung looks like, decided once, applied every time:**

| Rung | Where it sits | Size | Weight | Spacing | How many |
|---|---|---|---|---|---|
| `hero` | top, full width | biggest step on your type ramp | strongest | most generous | exactly 1 |
| `primary` | right underneath | one step down | strong | generous | 0 or 1 |
| `supporting` | grouped below | body text | normal | compact | up to 3 |
| `ambient` | edges, footer, margins | smallest step | muted | tightest | up to 2 |

**M12. Every element says what job it does: action, input, navigation, data-display, or feedback.**
Two uses. It's how the model narrows down which component to reach for, and it's your smell test:
three data-displays and no action means it showed you things and answered nothing.

**J4. Nothing on screen competes with anything else.**
A grid of equal cards means the ladder got ignored. Send it back.

---

## D. Stability. The bit nobody has figured out yet.

Longer version in `spec/stability.md`. The rules:

**M13. The overall shape of the screen stays put.**
It only changes when what you're doing genuinely changes, and when it does, you see it happen.
Never a silent reshuffle.

**M14. Every element keeps the same name across turns.**
`filter.price` stays `filter.price` forever. Not `block_3`, because that changes the moment
anything reorders. Everything else in this section depends on getting this right.

**M15. Each turn is a change to the last screen, not a new one:**
- nothing changed: it doesn't move, doesn't fade, doesn't redraw
- content changed: it updates where it stands
- something new: it arrives
- something gone: it leaves, and you can get it back

The first line is the one people get wrong. Most builds redraw everything every turn and the
whole screen flinches. Not moving is the feature.

**M16. Nothing jumps more than one rung per turn.**
Nothing teleports from the footer to the top of the page.

**M17. If more than half the screen changes at once, show it changing.**
Don't cross-fade a big change. People feel like they blinked and missed something. Make it
legible.

**M18. Nothing moves while someone is touching it.**
Focused, hovered, half-typed into: it stays put until they're done. Queue the move.

---

## E. Trust. It can't gaslight people.

**M19. Everything on screen can be questioned, kept, or thrown away.**
Why is this here. Keep this. Get rid of this.

**M20. Kept things are untouchable.**
The model gets them as fixed and plans around them. This is what turns "the AI keeps taking away
the thing I need" into a non-problem, and it's about ten lines of code.

**M21. Thrown-away things stay gone for the session** unless someone asks for them back.

**J5. "Why is this here" needs an actual reason.**
"Because you gave a budget" is a reason. "Price filter" is a label.

---

## F. How to work on the day

**M22. Nothing renders unchecked. No dev bypass.**
If the validator is switched off, the demo is off.

**M23. When it fails, tell the model exactly what broke and let it try again once.**
The failing rule number and the offending value. Then fall back to the last screen that worked.
Don't let it spiral.

**M24. Keep every description the session produced.**
Being able to show the JSON next to the screen is half the demo.
