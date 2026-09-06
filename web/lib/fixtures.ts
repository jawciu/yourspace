// Hand-written plans for the fallback path only (no key, or the model failed twice, M23). They
// follow the same journey the model is asked for: one question at a time, then a photo, then the
// render with costs and things to buy. The render step uses the pre-generated living room.
import type { UIPlan } from './validate';

const INTENT = 'A brighter, warmer living room in your own style';

const STAGES = [
  { id: 'prep', title: 'Strip back and prepare', when: 'Week 1', items: ['Lift the carpet, check for parquet', 'Gas fire out, chimney capped', 'Walls made good'], cost: 1800 },
  { id: 'fabric', title: 'Warmth first', when: 'Weeks 2 to 3', items: ['Insulate behind the panelled wall', 'Draught-proof the window', 'Radiator resized for the room'], cost: 2600 },
  { id: 'finishes', title: 'The room you see', when: 'Weeks 4 to 6', items: ['Walnut panelling on the fireplace wall', 'Restore the parquet', 'Limestone surround', 'Sideboard, armchair, arc lamp, rug'], cost: 9800 },
];

const PRODUCTS = [
  { name: 'Walnut slat wall panelling', kind: 'product', price: 1450, detail: 'The warm wall behind the fireplace, real veneer so it ages well', image_brief: 'Vertical walnut slat wall panels, product photo, plain pale background, soft daylight' },
  { name: 'Low walnut sideboard, 180 cm', kind: 'product', price: 890, detail: 'Mid-century proportions, hides the TV box and the clutter', image_brief: 'Low mid-century walnut sideboard with tapered legs, product photo on a plain pale background' },
  { name: 'Wool rug, terracotta and mustard', kind: 'product', price: 620, detail: 'The colour in the room lives here, so the walls can stay calm', image_brief: 'Flat wool rug with soft terracotta and mustard geometric shapes, product photo from above on a plain background' },
  { name: 'Parquet restoration', kind: 'service', price: 2400, detail: 'Sand, repair and oil the floor already under your carpet', image_brief: 'A craftsperson sanding a herringbone oak parquet floor in a bright room, editorial photo' },
];

const RENDER_BRIEF = 'Walnut panelling on the fireplace wall, fireplace kept with a plain limestone surround and no gas fire, restored oak parquet, a wool rug in terracotta and mustard, low walnut sideboard, caramel leather armchair, arc floor lamp, linen curtains. Same camera, same window, same room shape.';
const RENDER_BRIEF_TIMBER = 'Pale oak slatted panelling on the fireplace wall, fireplace kept with a plain limestone surround, pale oak floor, off-white and sage textiles, low oak sideboard, light grey wool sofa, paper pendant, linen curtains. No orange or terracotta. Same camera, same window, same room shape.';

export const FIXTURES: Record<string, UIPlan> = {
  'sam:goal': {
    intent: INTENT,
    frame: 'focus',
    blocks: [
      { id: 'question.space', component: 'question.text', intent_class: 'input', tier: 'hero', why: 'One space at a time is how this stays sane', props: { question: 'Which space do you want to start with, and what bothers you most about it?', placeholder: 'The living room. It is dark and the gas fire is hideous.', answerKey: 'space' } },
    ],
    primary_action: { block_id: 'question.space', label: 'Answer' },
    memory: [{ label: 'Goal', value: 'A brighter, warmer home in their own style' }],
  },
  'sam:space': {
    intent: INTENT,
    frame: 'focus',
    blocks: [
      { id: 'question.taste', component: 'question.text', intent_class: 'input', tier: 'hero', why: 'So the room ends up yours, not a showroom', props: { question: 'What do you love, or what have you seen that you keep coming back to?', placeholder: 'Warm timber, mid-century, a bit Scandinavian, nothing shiny', answerKey: 'taste' } },
      { id: 'plan.assumptions', component: 'assumptions.list', intent_class: 'data-display', tier: 'supporting', why: 'What you have told us so far', props: { items: [{ label: 'Space', value: 'Living room', source: 'you told us' }, { label: 'Bothers you', value: 'Dark, dated gas fire', source: 'you told us' }] } },
    ],
    primary_action: { block_id: 'question.taste', label: 'Answer' },
    memory: [{ label: 'Goal', value: 'A brighter, warmer home in their own style' }, { label: 'Space', value: 'Living room' }, { label: 'Bothers them', value: 'Dark, dated gas fire' }],
  },
  'sam:budget': {
    intent: INTENT,
    frame: 'focus',
    blocks: [
      { id: 'question.budget', component: 'question.text', intent_class: 'input', tier: 'hero', why: 'A rough number keeps the plan honest rather than a wish list', props: { question: 'Roughly what can you spend on this room, and by when?', placeholder: 'About £15k, done before Christmas', answerKey: 'budget' } },
      { id: 'plan.assumptions', component: 'assumptions.list', intent_class: 'data-display', tier: 'supporting', why: 'What you have told us so far', props: { items: [{ label: 'Space', value: 'Living room', source: 'you told us' }, { label: 'Bothers you', value: 'Dark, dated gas fire', source: 'you told us' }, { label: 'Taste', value: 'Warm timber, mid-century', source: 'you told us' }] } },
    ],
    primary_action: { block_id: 'question.budget', label: 'Answer' },
    memory: [{ label: 'Goal', value: 'A brighter, warmer home in their own style' }, { label: 'Space', value: 'Living room' }, { label: 'Bothers them', value: 'Dark, dated gas fire' }, { label: 'Taste', value: 'Warm timber, mid-century' }],
  },
  'sam:photo': {
    intent: INTENT,
    frame: 'focus',
    blocks: [
      { id: 'photo.living_room', component: 'photo.upload', intent_class: 'input', tier: 'hero', why: 'One photo and we can show you the room, not describe it', props: { prompt: 'Stand in the doorway and take the widest photo you can of the living room, window in shot', scene: 'living_room' } },
      { id: 'plan.assumptions', component: 'assumptions.list', intent_class: 'data-display', tier: 'supporting', why: 'What the design will be built on', props: { items: [{ label: 'Space', value: 'Living room', source: 'you told us' }, { label: 'Bothers you', value: 'Dark, dated gas fire', source: 'you told us' }, { label: 'Taste', value: 'Warm timber, mid-century', source: 'you told us' }, { label: 'Budget', value: 'About £15k by Christmas', source: 'you told us' }] } },
    ],
    primary_action: { block_id: 'photo.living_room', label: 'Add a photo' },
    memory: [{ label: 'Goal', value: 'A brighter, warmer home in their own style' }, { label: 'Space', value: 'Living room' }, { label: 'Bothers them', value: 'Dark, dated gas fire' }, { label: 'Taste', value: 'Warm timber, mid-century' }, { label: 'Budget', value: 'About £15k by Christmas' }],
  },
  'sam:render': {
    intent: INTENT,
    frame: 'focus',
    blocks: [
      { id: 'render.living_room', component: 'render.compare', intent_class: 'data-display', tier: 'hero', why: 'Your room, from your photo, in the warmth you described', props: { scene: 'living', version: 'default', brief: RENDER_BRIEF, caption: 'Walnut, parquet, terracotta and mustard, the gas fire gone' } },
      { id: 'plan.stages', component: 'plan.stages', intent_class: 'data-display', tier: 'primary', why: 'Three stages, warmth before finishes, inside your £15k', props: { stages: STAGES } },
      { id: 'products.list', component: 'products.list', intent_class: 'data-display', tier: 'supporting', why: 'The things in the picture, and who does the floor', props: { items: PRODUCTS } },
      { id: 'note.parquet', component: 'note.explain', intent_class: 'feedback', tier: 'supporting', why: 'One thing to check before you commit', props: { text: 'Most houses of this age have oak parquet under the carpet. If yours does, restoring it costs a third of a new floor and is the most mid-century thing in the room.' } },
      { id: 'action.save', component: 'action.cta', intent_class: 'action', tier: 'ambient', why: 'Keep this and pick it up any time', props: { label: 'Save this plan', secondary: 'Talk to a designer' } },
    ],
    primary_action: { block_id: 'action.save', label: 'Save this plan' },
    memory: [{ label: 'Goal', value: 'A brighter, warmer home in their own style' }, { label: 'Space', value: 'Living room' }, { label: 'Bothers them', value: 'Dark, dated gas fire' }, { label: 'Taste', value: 'Warm timber, mid-century' }, { label: 'Budget', value: 'About £15k by Christmas' }, { label: 'Photo', value: 'Living room, uploaded' }],
  },
  'sam:tweak': {
    intent: INTENT,
    frame: 'focus',
    blocks: [
      { id: 'render.living_room', component: 'render.compare', intent_class: 'data-display', tier: 'hero', why: 'Same room, calmer: pale oak, sage and off-white, no orange', props: { scene: 'living', version: 'timber', brief: RENDER_BRIEF_TIMBER, caption: 'Pale oak and sage, the terracotta gone' } },
      { id: 'plan.stages', component: 'plan.stages', intent_class: 'data-display', tier: 'primary', why: 'Three stages, warmth before finishes, inside your £15k', props: { stages: STAGES.map(s => s.id === 'finishes' ? { ...s, items: ['Pale oak slatted panelling on the fireplace wall', 'Restore the parquet, lime-wash it pale', 'Limestone surround', 'Oak sideboard, grey wool sofa, paper pendant'], cost: 9200 } : s) } },
      { id: 'products.list', component: 'products.list', intent_class: 'data-display', tier: 'supporting', why: 'Swapped for the calmer palette', props: { items: [
        { name: 'Pale oak slat wall panelling', kind: 'product', price: 1250, detail: 'Lighter than walnut, so the wall glows instead of absorbing light', image_brief: 'Vertical pale oak slat wall panels, product photo, plain pale background, soft daylight' },
        { name: 'Low oak sideboard, 180 cm', kind: 'product', price: 790, detail: 'Same job, lighter timber to match the wall', image_brief: 'Low mid-century pale oak sideboard with tapered legs, product photo on a plain background' },
        { name: 'Light grey wool sofa, 3 seat', kind: 'product', price: 1400, detail: 'The one soft grey in the room, everything else is oak and sage', image_brief: 'Light grey wool three-seat sofa with slim oak legs, product photo on a plain background' },
        { name: 'Parquet restoration and lime-wash', kind: 'service', price: 2700, detail: 'Sand and oil, then a pale wash to match the oak', image_brief: 'A craftsperson applying a pale lime-wash oil to a herringbone parquet floor, editorial photo' },
      ] } },
      { id: 'note.parquet', component: 'note.explain', intent_class: 'feedback', tier: 'supporting', why: 'One thing to check before you commit', props: { text: 'Most houses of this age have oak parquet under the carpet. If yours does, restoring it costs a third of a new floor and is the most mid-century thing in the room.' } },
      { id: 'action.save', component: 'action.cta', intent_class: 'action', tier: 'ambient', why: 'Keep this and pick it up any time', props: { label: 'Save this plan', secondary: 'Talk to a designer' } },
    ],
    primary_action: { block_id: 'action.save', label: 'Save this plan' },
    memory: [{ label: 'Goal', value: 'A brighter, warmer home in their own style' }, { label: 'Space', value: 'Living room' }, { label: 'Bothers them', value: 'Dark, dated gas fire' }, { label: 'Taste', value: 'Pale oak, sage, no orange' }, { label: 'Budget', value: 'About £15k by Christmas' }, { label: 'Photo', value: 'Living room, uploaded' }],
  },
};

const ORDER = ['goal', 'space', 'budget', 'photo', 'render', 'tweak'];

export function pickFixture(personaId: string, message: string, prevKey?: string | null): string | null {
  const m = message.toLowerCase();
  const has = (...ws: string[]) => ws.some(w => m.includes(w));
  const k = (s: string) => (FIXTURES[`${personaId}:${s}`] ? `${personaId}:${s}` : null);
  const step = prevKey?.startsWith(`${personaId}:`) ? prevKey.slice(personaId.length + 1) : null;
  if (has('photo id')) return k('render');
  if ((step === 'render' || step === 'tweak') && has('less ', 'more ', 'instead', 'darker', 'lighter', 'timber', 'orange', 'calmer', 'pale')) return k('tweak');
  if (step === 'render' || step === 'tweak') return prevKey ?? null; // hold the screen for asks we cannot script
  if (!step) return k('goal');
  const next = ORDER[Math.min(ORDER.indexOf(step) + 1, ORDER.indexOf('photo'))];
  return k(next) ?? prevKey ?? null;
}
