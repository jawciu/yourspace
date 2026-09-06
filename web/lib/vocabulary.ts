// The closed vocabulary for a house design company. Validator, prompt and renderer registry all
// read this file. Unpublished components stay in the registry but are invisible to the model.

export type IntentClass = 'action' | 'input' | 'navigation' | 'data-display' | 'feedback';
export type Tier = 'hero' | 'primary' | 'supporting' | 'ambient';
export type Frame = 'focus' | 'compare' | 'browse' | 'monitor';

export const TIERS: Tier[] = ['hero', 'primary', 'supporting', 'ambient'];
export const FRAMES: Frame[] = ['focus', 'compare', 'browse', 'monitor'];
export const INTENT_CLASSES: IntentClass[] = ['action', 'input', 'navigation', 'data-display', 'feedback'];

export interface ComponentDef { intent_class: IntentClass; published: boolean; what: string; when: string; whenNot: string; pairsWith: string; props: string; required: string[] }

export const COMPONENTS: Record<string, ComponentDef> = {
  'question.single': {
    intent_class: 'input', published: false,
    what: 'One question with two to five tappable answers.',
    when: 'A fact we cannot infer is needed before the plan is honest: where to start, budget, how long they plan to stay.',
    whenNot: 'Never ask something the listing already tells us. Two or three questions per turn at most, one per tier, hero first. For anything the customer would rather describe, use question.text.',
    pairsWith: 'question.text, assumptions.list',
    props: '{ question: string, options: string[], answerKey: "start"|"budget"|"stay"|"style"|string, selected?: string }',
    required: ['question', 'options', 'answerKey']
  },
  'question.text': {
    intent_class: 'input', published: true,
    what: 'One question and a free text box, submit on enter. The customer answers in their own words, never a quiz.',
    when: 'You need one more thing before you can design: which space, what bothers them, what they love or reference, budget and timeline. Exactly ONE per turn, always at hero. It is the whole point of that screen.',
    whenNot: 'Never two in one plan. Never below hero. Never once a photo has been uploaded, that turn is a render. Never ask what the memory already holds.',
    pairsWith: 'assumptions.list (only what they actually said), note.explain',
    props: '{ question: string, placeholder?: string (an example answer in the customer\'s voice), answerKey: string (snake_case slug) }',
    required: ['question', 'answerKey']
  },
  'photo.upload': {
    intent_class: 'input', published: true,
    what: 'A drop zone for one photo. kind "room" (default) is the space being designed; kind "inspiration" is an optional reference image of a room they love. The photo is stored and gets an id the customer\'s next message will quote.',
    when: 'kind "room": once you know the space, what bothers them, what they love and roughly the budget, and no upload of that space exists yet. Always at hero, no question.text in the same plan. kind "inspiration": on the taste/style question, ALSO offer an optional inspiration upload at supporting (people think in reference images), scene "inspiration".',
    whenNot: 'Not when an upload of that space is already in `uploads`. Not before you know what they want. Not as decoration. Never an inspiration upload on a render turn.',
    pairsWith: 'question.text (inspiration only), assumptions.list, note.explain',
    props: '{ prompt: string (what to photograph and from where), scene: string (slug for what the photo shows, e.g. "front", "living_room", "garden", "inspiration"), kind?: "room"|"inspiration" (default "room") }',
    required: ['prompt', 'scene']
  },
  'render.compare': {
    intent_class: 'data-display', published: true,
    what: 'One scene of the house, now and re-imagined, with a Now / After toggle. The image is produced by the renderer from scene + version + brief, never by the model.',
    when: 'An upload id for the space exists in `uploads`. Use that id as scene. Hero whenever it is the scene being discussed. Earlier scenes step down one tier, they do not vanish. A render turn never contains a question.',
    whenNot: 'Never before a photo has been uploaded. Never with a made-up scene key. Never two renders of the same scene.',
    pairsWith: 'plan.stages, recommendation.card, action.cta',
    props: '{ scene: string (a key from photosOnFile, or an uploaded photo id like "up_ab12"), version: string (short slug, "default" for the first, a new slug for a changed brief), brief: string (the design brief for the image, 2 to 4 sentences, concrete materials and colours, what stays the same), caption: string }',
    required: ['scene', 'version', 'brief', 'caption']
  },
  'plan.stages': {
    intent_class: 'data-display', published: true,
    what: 'The plan as two to four stages, each with a name, when, three or four items, and a cost. Total computed by the renderer.',
    when: 'As soon as there is a first scene. It carries across every turn and updates in place.',
    whenNot: 'Not as a menu of everything possible. Stages are ordered by what should happen first (fabric before finishes).',
    pairsWith: 'render.compare, recommendation.card',
    props: '{ stages: [{ id: string, title: string, when: string, items: string[], cost: number }] }',
    required: ['stages']
  },
  'products.list': {
    intent_class: 'data-display', published: true,
    what: 'What to buy and who to book, matched to the design: three to six items, each a product or a service with a realistic UK price and one line on why it fits. Images are made by the renderer from image_brief.',
    when: 'Alongside a render and plan.stages, once something has been designed. Pick items that appear in the brief (the sideboard, the panelling, the installer).',
    whenNot: 'Never before anything is designed. Not a catalogue: only things this design actually uses.',
    pairsWith: 'render.compare, plan.stages',
    props: '{ items: [{ name: string, kind: "product"|"service", price: number (GBP, realistic UK), detail: string (one line, why it fits this design), image_brief: string (short prompt for a product photo: the object alone on a neutral background, or for a service a representative scene) }] }',
    required: ['items']
  },
  'assumptions.list': {
    intent_class: 'data-display', published: true,
    what: 'The short list of what we know and used, each tagged with where it came from.',
    when: 'When a plan depends on things the customer said earlier, so they can see what you built on.',
    whenNot: 'Never for facts about the house you were not told. Sources are only "your words", "you told us" or "assumed" (and say so).',
    pairsWith: 'question.text, plan.stages',
    props: '{ items: [{ label: string, value: string, source: "your words"|"you told us"|"assumed" }] }',
    required: ['items']
  },
  'recommendation.card': {
    intent_class: 'data-display', published: true,
    what: 'One recommendation in plain words with one reason and up to three short points.',
    when: 'The answer is a decision: start here, skip that, do this first.',
    whenNot: 'Not as a summary of what is on screen. One recommendation, or ask a question.',
    pairsWith: 'plan.stages, render.compare',
    props: '{ headline: string, reason: string, points?: string[] }',
    required: ['headline', 'reason']
  },
  'note.explain': {
    intent_class: 'feedback', published: true,
    what: 'One short paragraph in the customer\'s terms. The caveat, the why.',
    when: 'A number or a render needs one sentence of context.',
    whenNot: 'Not for marketing. If there is nothing to caveat, leave it out.',
    pairsWith: 'anything at hero or primary',
    props: '{ text: string }',
    required: ['text']
  },
  'list.alternatives': {
    intent_class: 'navigation', published: true,
    what: 'Two to four things the customer could look at next, each one line.',
    when: 'A natural next step exists (another room, the garden) and the current one is done.',
    whenNot: 'Not as a menu of everything the service does.',
    pairsWith: 'recommendation.card',
    props: '{ items: [{ label: string, detail: string }] }',
    required: ['items']
  },
  'action.cta': {
    intent_class: 'action', published: true,
    what: 'The one button. Optionally a quieter second choice.',
    when: 'There is something real to do next: save the plan, book a designer, get quotes.',
    whenNot: 'Not two of them.',
    pairsWith: 'everything. This is what primary_action points at.',
    props: '{ label: string, target?: string, secondary?: string }',
    required: ['label']
  },
  'stat.row': {
    intent_class: 'data-display', published: true,
    what: 'Two to four numbers with labels.',
    when: 'A handful of figures the customer will glance at (EPC now and after, yearly saving, payback).',
    whenNot: 'Never as a dashboard.',
    pairsWith: 'plan.stages',
    props: '{ stats: [{ label: string, value: string, unit?: string }] }',
    required: ['stats']
  },
  'status.done': {
    intent_class: 'feedback', published: true,
    what: 'A single calm line saying the thing is done.',
    when: 'The plan was saved, the designer booked.',
    whenNot: 'Anything the customer still has to do.',
    pairsWith: 'list.alternatives',
    props: '{ title: string, detail: string }',
    required: ['title', 'detail']
  },
};

export const PUBLISHED = Object.entries(COMPONENTS).filter(([, c]) => c.published);

export function vocabularyForPrompt(): string {
  return PUBLISHED.map(([name, c]) =>
    `### ${name}  (${c.intent_class})\n- what: ${c.what}\n- when: ${c.when}\n- when NOT, use instead: ${c.whenNot}\n- pairs with: ${c.pairsWith}\n- props: ${c.props}\n- required props (exact names, non-empty): ${c.required.join(', ')}`
  ).join('\n\n');
}
