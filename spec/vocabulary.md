# Vocabulary

The model may only say things from this file. Off-brand becomes a parse error, not a taste
argument.

## Intent classes

Borrowed wholesale from Subplane, because they hold up and someone already did the work of
proving they are exhaustive enough.

| Class | What it does |
|---|---|
| `action` | Makes something happen |
| `input` | Takes information from the user |
| `navigation` | Moves you around |
| `data-display` | Shows data |
| `feedback` | Keeps you up to date with system status |

The model picks a component by asking two questions, in this order:

1. **What tier am I building at?** (the floor)
2. **What job does this need to do?** (the room)

That pair eliminates almost everything before it reads a single component file.

## Tiers

`hero` | `primary` | `supporting` | `ambient`

The model assigns the tier. The renderer decides what a tier looks like, once, forever. See
rule M11 for the ladder.

## Frames

A frame is the stable outer shape of the screen. Pick a small fixed set and do not let the model
invent one. Ours:

| Frame | Use when |
|---|---|
| `focus` | One task, one answer. The default and the one to reach for. |
| `compare` | Two or three genuinely different options, side by side. |
| `browse` | A set plus a detail view. |
| `monitor` | Ongoing status the user checks rather than acts on. |

If you are tempted to add a fifth frame on the day, you are building an engine. Don't.

## Components

Fill this table in for your own domain before you generate anything. Each row is a component the
model is allowed to name. Anything not in this table does not exist.

Every component needs the Subplane fields, and the fourth one is the one that matters most:

- **What it is**
- **When to use it**
- **When NOT to use it, and what to use instead**  <- this is what stops the model hedging
- **What it pairs with**
- **Shape of the data it expects**

Generated from `web/lib/vocabulary.ts`, which is the source of truth (validator, prompt and
renderer registry all read it). Twelve components for a house design company, one journey:
where to start, the front, a room, a tweak, save.

| Component | Intent class | When to use | When not to use, use instead |
|---|---|---|---|
| `question.single` | input | A fact we cannot infer is needed before the plan is honest: where to start, budget, how long they plan to stay. | Never ask something the listing already tells us. Two or three questions per turn at most, one per tier, hero first. For anything the customer would rather describe, use question.text. |
| `question.text` | input | The honest answer is a description: what they love about the house, what they hate, references. | Not for things with three obvious options. |
| `photo.upload` | input | A render needs a photo we do not have. If the listing photo exists for that scene, do not ask, render from it. | Not as decoration. |
| `render.compare` | data-display | The customer has said where to start and a photo of that scene exists. The hero whenever it is the scene being discussed. Earlier scenes step down one tier, they do not vanish. | Never before the customer has said what they want. Never two renders of the same scene. |
| `plan.stages` | data-display | As soon as there is a first scene. It carries across every turn and updates in place. | Not as a menu of everything possible. Stages are ordered by what should happen first (fabric before finishes). |
| `assumptions.list` | data-display | On the first turn (listing and EPC facts, and what we read from their words) and whenever a plan depends on them. | Not for things the customer just said this turn. |
| `recommendation.card` | data-display | The answer is a decision: start here, skip that, do this first. | Not as a summary of what is on screen. One recommendation, or ask a question. |
| `note.explain` | feedback | A number or a render needs one sentence of context. | Not for marketing. If there is nothing to caveat, leave it out. |
| `list.alternatives` | navigation | A natural next step exists (another room, the garden) and the current one is done. | Not as a menu of everything the service does. |
| `action.cta` | action | There is something real to do next: save the plan, book a designer, get quotes. | Not two of them. |
| `stat.row` | data-display | A handful of figures the customer will glance at (EPC now and after, yearly saving, payback). | Never as a dashboard. |
| `status.done` | feedback | The plan was saved, the designer booked. | Anything the customer still has to do. |

## Component detail

### `question.single`
- **Intent class:** input · **published:** true
- **What it is:** One question with two to five tappable answers.
- **When to use it:** A fact we cannot infer is needed before the plan is honest: where to start, budget, how long they plan to stay.
- **When NOT to use it, use instead:** Never ask something the listing already tells us. Two or three questions per turn at most, one per tier, hero first. For anything the customer would rather describe, use question.text.
- **Pairs with:** question.text, assumptions.list
- **Props:** `{ question: string, options: string[], answerKey: "start"|"budget"|"stay"|"style"|string, selected?: string }`

### `question.text`
- **Intent class:** input · **published:** true
- **What it is:** One question and a free text box, submit on enter.
- **When to use it:** The honest answer is a description: what they love about the house, what they hate, references.
- **When NOT to use it, use instead:** Not for things with three obvious options.
- **Pairs with:** question.single, photo.upload
- **Props:** `{ question: string, placeholder?: string, answerKey: string }`

### `photo.upload`
- **Intent class:** input · **published:** true
- **What it is:** A drop zone for one photo of a room or the front of the house.
- **When to use it:** A render needs a photo we do not have. If the listing photo exists for that scene, do not ask, render from it.
- **When NOT to use it, use instead:** Not as decoration.
- **Pairs with:** render.compare
- **Props:** `{ prompt: string, scene: "exterior"|"living"|"kitchen"|"garden"|"bedroom" }`

### `render.compare`
- **Intent class:** data-display · **published:** true
- **What it is:** One scene of the house, now and re-imagined, with a Now / After toggle. The image is produced by the renderer from scene + version + brief, never by the model.
- **When to use it:** The customer has said where to start and a photo of that scene exists. The hero whenever it is the scene being discussed. Earlier scenes step down one tier, they do not vanish.
- **When NOT to use it, use instead:** Never before the customer has said what they want. Never two renders of the same scene.
- **Pairs with:** plan.stages, recommendation.card, action.cta
- **Props:** `{ scene: "exterior"|"living"|"kitchen"|"garden"|"bedroom", version: string (short slug, "default" for the first, a new slug for a changed brief), brief: string (the design brief for the image, 2 to 4 sentences, concrete materials and colours), caption: string }`

### `plan.stages`
- **Intent class:** data-display · **published:** true
- **What it is:** The plan as two to four stages, each with a name, when, three or four items, and a cost. Total computed by the renderer.
- **When to use it:** As soon as there is a first scene. It carries across every turn and updates in place.
- **When NOT to use it, use instead:** Not as a menu of everything possible. Stages are ordered by what should happen first (fabric before finishes).
- **Pairs with:** render.compare, recommendation.card
- **Props:** `{ stages: [{ id: string, title: string, when: string, items: string[], cost: number }] }`

### `assumptions.list`
- **Intent class:** data-display · **published:** true
- **What it is:** The short list of what we know and used, each tagged with where it came from.
- **When to use it:** On the first turn (listing and EPC facts, and what we read from their words) and whenever a plan depends on them.
- **When NOT to use it, use instead:** Not for things the customer just said this turn.
- **Pairs with:** question.single, plan.stages
- **Props:** `{ items: [{ label: string, value: string, source: "listing"|"epc"|"your words"|"you told us"|"assumed" }] }`

### `recommendation.card`
- **Intent class:** data-display · **published:** true
- **What it is:** One recommendation in plain words with one reason and up to three short points.
- **When to use it:** The answer is a decision: start here, skip that, do this first.
- **When NOT to use it, use instead:** Not as a summary of what is on screen. One recommendation, or ask a question.
- **Pairs with:** plan.stages, render.compare
- **Props:** `{ headline: string, reason: string, points?: string[] }`

### `note.explain`
- **Intent class:** feedback · **published:** true
- **What it is:** One short paragraph in the customer's terms. The caveat, the why.
- **When to use it:** A number or a render needs one sentence of context.
- **When NOT to use it, use instead:** Not for marketing. If there is nothing to caveat, leave it out.
- **Pairs with:** anything at hero or primary
- **Props:** `{ text: string }`

### `list.alternatives`
- **Intent class:** navigation · **published:** true
- **What it is:** Two to four things the customer could look at next, each one line.
- **When to use it:** A natural next step exists (another room, the garden) and the current one is done.
- **When NOT to use it, use instead:** Not as a menu of everything the service does.
- **Pairs with:** recommendation.card
- **Props:** `{ items: [{ label: string, detail: string }] }`

### `action.cta`
- **Intent class:** action · **published:** true
- **What it is:** The one button. Optionally a quieter second choice.
- **When to use it:** There is something real to do next: save the plan, book a designer, get quotes.
- **When NOT to use it, use instead:** Not two of them.
- **Pairs with:** everything. This is what primary_action points at.
- **Props:** `{ label: string, target?: string, secondary?: string }`

### `stat.row`
- **Intent class:** data-display · **published:** true
- **What it is:** Two to four numbers with labels.
- **When to use it:** A handful of figures the customer will glance at (EPC now and after, yearly saving, payback).
- **When NOT to use it, use instead:** Never as a dashboard.
- **Pairs with:** plan.stages
- **Props:** `{ stats: [{ label: string, value: string, unit?: string }] }`

### `status.done`
- **Intent class:** feedback · **published:** true
- **What it is:** A single calm line saying the thing is done.
- **When to use it:** The plan was saved, the designer booked.
- **When NOT to use it, use instead:** Anything the customer still has to do.
- **Pairs with:** list.alternatives
- **Props:** `{ title: string, detail: string }`

## Publishing

Each component has a published flag. Unpublished components are invisible to the model. This is
your fastest lever on the day: if the model keeps reaching for something that looks bad, do not
prompt it not to. Unpublish the component.
