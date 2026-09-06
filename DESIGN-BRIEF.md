# Design brief: what to design, and the house to model

The renderer is built and every block below already renders in two placeholder brands (`volt`,
light and warm; `ember`, dark). Your job is the real brand: swap the token values at the top of
`web/app/globals.css` (keep the token names) and restyle the block classes below them. Nothing
in the model's output can affect appearance, so whatever you design is what ships, every time.

## The ladder first (M11)

Four tiers, decided once. Every block lands on one of these rungs and takes its size, weight and
spacing from the rung, never from the block.

| Tier | Where | Type step | Count on screen |
|---|---|---|---|
| `hero` | top, full width | biggest (`--t3` titles, `--t4` numbers) | exactly 1 |
| `primary` | right under | one down (`--t2` / `--t3`) | 0 or 1 |
| `supporting` | grouped below | body (`--t1` / `--t2`) | up to 3 |
| `ambient` | edges, no card | smallest, muted | up to 2 |

Two frames in use: `focus` (one column, 760px) and `compare` (hero full width, then two columns,
1080px).

## The 14 blocks

Each needs a hero, primary, supporting and ambient state, because the same block can sit on any
rung. In practice the ones that go hero are marked.

| Block | Goes hero? | What it shows | States to design |
|---|---|---|---|
| `meter.reading` | yes (Priya) | fuel label, serial, one big digit field, unit, last-reading hint | digits · photo mode (drop zone) · filled |
| `status.done` | yes | tick, title, one line of proof | default |
| `question.single` | yes (solar turn 1) | question, 2 to 5 chips | none picked · picked · disabled while thinking |
| `photo.upload` | no | drop zone with one line of prompt | empty · hover · preview after drop |
| `solar.render` | yes | the house before/after, caption, Now / With panels toggle | after (default) · before |
| `assumptions.list` | sometimes | label, value, source pill (account / meter / you told us / assumed) | default |
| `solar.estimate` | no, primary | five stats: kWp, kWh/yr, £/yr, installed cost, payback years | default · unsuitable (one line of reason) |
| `recommendation.card` | yes (Aisha) | headline, one-paragraph reason, up to 3 points | default |
| `tariff.current` | no, primary | "You are on", name, three stats, one-line summary | with end date · no term |
| `tariff.compare` | yes | 2 or 3 columns, best marked, £/yr, saving, term, exit fee, summary | best · other · loss (costs more) |
| `note.explain` | no | one paragraph | default |
| `list.alternatives` | no, primary (Aisha) | 2 to 4 rows, label + detail, each tappable | default · hover |
| `action.cta` | no | one primary button, optional quiet secondary link | default · disabled while thinking |
| `stat.row` | no | 2 to 4 label/value pairs | default |

Chrome around the blocks, also yours: the intent line (page title), the `why` line at the top of
every block with the keep / × tools on hover, the reshape banner (shows when more than half the
screen changed), the "bring back" undo chips, the suggestion chips, the ask bar, and the JSON rail.

## The pre-generated house

One house, two images, same framing. It is Sam's, `7 Cotham Grove, Bristol`, 1968.

- **Detached, two storeys, 1960s.** Brick or pale render, big plain windows, no bay, no porch.
- **Gable-ended pitched roof, about 38 degrees, plain concrete tiles, mid brown.** One main slope
  faces the camera and it is the south slope. Nothing on it: no chimney on that slope, no dormer,
  no Velux. A chimney at the far gable end is fine.
- **Shot from the pavement across the road, slightly to the left of centre, eye level, 3:2
  landscape, bright overcast light** so there are no hard shadows to fight when the panels go on.
- **Front garden, low hedge or lawn, a driveway to one side.** No cars, no people, no house
  number legible.
- **Image 2 is identical** with **12 all-black panels in a 4 x 3 grid** on the visible slope,
  landscape orientation, one tile of margin from the ridge, eaves and edges. Nothing else changes:
  same sky, same hedge, same pixel framing, so the Now / With panels toggle reads as one photo.

Save as `web/public/house/sam-before.jpg` and `sam-after.jpg` (any size, 1800 x 1200 is
plenty), then change the two paths in `HOUSE_IMAGES` in `web/lib/data.ts` from `.svg` to `.jpg`.
Priya's semi in Manchester has the same slots if there is time, 10 panels in a 5 x 2 grid.
