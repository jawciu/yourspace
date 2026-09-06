# Stability

This is the undesigned part of the brief and the reason to spend Sunday here rather than on
prettier output.

## The problem

A generated interface that reassembles itself every turn is unusable, however good each
individual frame looks. People build spatial memory within seconds. They remember that the thing
they want is on the left, two down. If the layout regenerates wholesale, that memory is wrong
every turn, and the interface feels like it is arguing with them.

Every previous paradigm solved this for free. A static UI is stable because nobody moved it. Gen
UI has to earn stability deliberately, and nothing in the current crop of demos does, because
demos are one turn long and the problem only shows up on turn three.

## The model

Treat a turn as a **diff against the previous plan**, not a fresh render.

```
plan(n) + user input  ->  plan(n+1)
render = diff(plan(n), plan(n+1))
```

Everything below follows from that.

## Identity

Block `id` is the whole mechanism. It must be:

- **Semantic**: `filter.price`, `summary.spend`, `action.book`
- **Stable**: the same job gets the same id on every turn, forever
- **Not positional**: never `block_2`, never index-derived

Give the model the previous turn's ids and instruct it to reuse any id whose job still exists.
A new id is a claim that this is a genuinely new thing on screen, and it should be rare.

## The diff table

| Case | Renderer behaviour |
|---|---|
| id present in both, props identical | do nothing. Do not re-mount. Do not re-animate. |
| id present in both, props changed | animate the change in place. Position holds. |
| id present in both, tier changed | move by at most one tier step (M16), animated |
| id only in new plan | enter, from the position it will occupy |
| id only in old plan | exit, leaving an undo trace |

The first row is the one people get wrong. Most implementations re-render everything and the
whole screen twitches on every turn. The absence of motion is the feature.

## Frame persistence

`frame` is sticky (M13). Changing it is the biggest thing that can happen to a screen, so it
gets treated as such: an explicit transition the user can see, not a swap between two renders.

Practically: keep the frame, regenerate only what is inside it. If the model wants a new frame,
that is a strong enough signal that it should probably be asking a question instead.

## The half rule

If more than half the blocks change in a single turn (M17), do not cross-fade. Cross-fading a
majority change makes the user feel like they blinked and missed something. Instead, make the
transition explicit and directional so the change is legible as a change.

## Focus lock

Nothing moves while the user is touching it (M18). If a block has focus, hover, an open menu, or
a partially filled field, it is pinned in place until that ends, even if the new plan wants it
elsewhere. Queue the move.

## Pinning

User pinning (M20) is the manual version of the same idea, and it is also the escape hatch for
when the model is wrong. A pinned block is passed to the next generation as fixed. The model
plans around it. This turns "the AI keeps taking away the thing I need" into a solved problem in
about ten lines of code, and it demos beautifully.

## What to build first

1. Diff by id with the do-nothing case correct. Half a day.
2. Pin and dismiss. An hour, and it is the trust story.
3. The half rule and focus lock. Cut these first if time runs out.
