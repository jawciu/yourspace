// Port of ../validate.mjs with the vocabulary filled in. Same rule numbers, same messages.
import { COMPONENTS, TIERS, FRAMES, INTENT_CLASSES, type Tier, type Frame, type IntentClass } from './vocabulary';

export interface Block {
  id: string;
  component: string;
  intent_class: IntentClass;
  tier: Tier;
  why: string;
  props?: Record<string, unknown>;
}
export interface UIPlan {
  intent: string;
  frame: Frame;
  blocks: Block[];
  primary_action: { block_id: string; label: string };
  question?: string;
  memory?: { label: string; value: string }[];
  progress?: { done: number; total: number; label: string };
}

const MAX_BLOCKS = 5;
const TIER_CAPS: Record<Tier, [number, number]> = { hero: [1, 1], primary: [0, 1], supporting: [0, 3], ambient: [0, 2] };
const APPEARANCE = /colou?r|background|bg|font|size|scale|width|height|padding|margin|gap|radius|shadow|opacity|weight|align|classname|class|style|css|theme|variant|tw/i;
const ID = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

export interface Verdict { ok: boolean; errors: string[]; warnings: string[]; changedShare: number }

export function validate(plan: unknown, prev?: UIPlan | null): Verdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fail = (rule: string, msg: string) => errors.push(`${rule}  ${msg}`);
  let changedShare = 0;

  if (typeof plan !== 'object' || plan === null || Array.isArray(plan)) {
    fail('M1', 'plan is not an object');
    return { ok: false, errors, warnings, changedShare };
  }
  const p = plan as Record<string, unknown>;
  for (const k of Object.keys(p)) {
    if (!['intent', 'frame', 'blocks', 'primary_action', 'question', 'memory', 'progress'].includes(k)) fail('M1', `unknown top-level key "${k}"`);
  }
  if (typeof p.intent !== 'string' || p.intent.trim().length < 3) fail('M1', 'missing "intent"');
  else if (p.intent.length > 90) fail('M1', `intent is ${p.intent.length} chars, it is the page heading, keep it under 90`);
  if (!FRAMES.includes(p.frame as Frame)) fail('M13', `frame "${p.frame}" is not one of ${FRAMES.join(', ')}`);

  const blocks = p.blocks as Block[];
  if (!Array.isArray(blocks) || blocks.length === 0) {
    fail('M5', 'blocks must be a non-empty array');
    return { ok: false, errors, warnings, changedShare };
  }
  if (blocks.length > MAX_BLOCKS) fail('M5', `${blocks.length} blocks, cap is ${MAX_BLOCKS}. The model is hedging.`);

  const seen = new Set<string>();
  blocks.forEach((b, i) => {
    const at = `blocks[${i}]`;
    if (typeof b.id !== 'string' || !ID.test(b.id)) fail('M14', `${at}.id "${b.id}" is not a semantic dotted id (lowercase, underscores ok, e.g. render.kitchen or action.save_plan)`);
    else if (/^block[._]?\d|^item[._]?\d|\.\d+$/.test(b.id)) fail('M14', `${at}.id "${b.id}" looks positional`);
    else if (seen.has(b.id)) fail('M14', `${at}.id "${b.id}" is duplicated`);
    else seen.add(b.id);

    const known = COMPONENTS[b.component];
    if (!known) fail('M1', `${at}.component "${b.component}" is not in the vocabulary`);
    else if (!known.published) fail('M1', `${at}.component "${b.component}" is unpublished`);
    else if (known.intent_class !== b.intent_class) fail('M10', `${at} declares intent_class "${b.intent_class}" but "${b.component}" is "${known.intent_class}"`);

    if (!INTENT_CLASSES.includes(b.intent_class)) fail('M10', `${at}.intent_class "${b.intent_class}" is invalid`);
    if (!TIERS.includes(b.tier)) fail('M10', `${at}.tier "${b.tier}" is invalid`);
    if (typeof b.why !== 'string' || b.why.trim().length < 8) fail('M9', `${at}.why is missing`);
    else if (b.why.length > 120) fail('M9', `${at}.why is ${b.why.length} chars, cap is 120`);
    for (const k of Object.keys(b.props ?? {})) if (APPEARANCE.test(k)) fail('M2', `${at}.props.${k} is an appearance concern`);
    if (known) for (const r of known.required) {
      const v = (b.props ?? {})[r];
      const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) fail('M1', `${at}.props.${r} is required for ${b.component} and is missing or empty. Props: ${known.props}`);
    }
    for (const k of Object.keys(b)) if (!['id', 'component', 'intent_class', 'tier', 'why', 'props'].includes(k)) fail('M1', `${at}.${k} is not part of the contract`);
  });

  for (const [tier, [min, max]] of Object.entries(TIER_CAPS) as [Tier, [number, number]][]) {
    const n = blocks.filter(b => b.tier === tier).length;
    if (n < min) fail(tier === 'hero' ? 'M6' : 'M7', `${n} blocks at tier "${tier}", minimum is ${min}`);
    if (n > max) fail(tier === 'hero' ? 'M6' : 'M7', `${n} blocks at tier "${tier}", maximum is ${max}`);
  }

  // M25: one question at a time. A question or a photo request is the point of the screen, so it
  // is the hero. A render turn is an answer, it never asks.
  const questions = blocks.filter(b => b.component === 'question.text');
  const allPhotos = blocks.filter(b => b.component === 'photo.upload');
  const inspo = allPhotos.filter(b => (b.props ?? {}).kind === 'inspiration');
  const photos = allPhotos.filter(b => (b.props ?? {}).kind !== 'inspiration');
  const renders = blocks.filter(b => b.component === 'render.compare');
  if (questions.length > 1) fail('M25', `${questions.length} question.text blocks. Ask ONE question per turn, the most useful one.`);
  for (const q of [...questions, ...photos]) if (q.tier !== 'hero') fail('M25', `"${q.id}" (${q.component}) must be the hero. A question or a photo request is the whole point of that screen.`);
  if (questions.length && photos.length) fail('M25', 'question.text and a room photo.upload in the same plan. Ask the question this turn, ask for the photo next turn.');
  if (inspo.length > 1) fail('M25', 'more than one inspiration photo.upload. One optional inspiration drop zone at supporting is enough.');
  for (const i of inspo) {
    if (i.tier !== 'supporting') fail('M25', `"${i.id}" is an inspiration upload, it sits at supporting under the question, never at ${i.tier}.`);
    if (!questions.length) fail('M25', `"${i.id}" inspiration upload only accompanies a question.text.`);
  }
  if (renders.length && questions.length) fail('M25', 'render.compare with question.text. A render turn is an answer, not a question. Drop the question.');
  if (renders.length && inspo.length) fail('M25', 'render.compare with an inspiration upload. The render turn is the answer, drop the upload.');

  // progress: loose shape check, only when present
  if (p.progress !== undefined) {
    const pr = p.progress as { done?: unknown; total?: unknown; label?: unknown } | null;
    if (typeof pr !== 'object' || pr === null) fail('M1', 'progress must be { done, total, label }');
    else {
      const { done, total, label } = pr;
      if (typeof done !== 'number' || typeof total !== 'number') fail('M1', 'progress.done and progress.total must be numbers');
      else if (total < 1 || total > 8) fail('M1', `progress.total is ${total}, it is the number of steps in this journey, 1 to 8`);
      else if (done > total) fail('M1', `progress.done ${done} exceeds progress.total ${total}`);
      if (typeof label !== 'string' || !label.trim()) fail('M1', 'progress.label is the current step in two or three words');
    }
  }

  const pa = p.primary_action as UIPlan['primary_action'] | undefined;
  if (!pa || typeof pa.block_id !== 'string' || typeof pa.label !== 'string') fail('M8', 'primary_action must be { block_id, label }');
  else if (!seen.has(pa.block_id)) fail('M8', `primary_action.block_id "${pa.block_id}" does not match any block`);

  if (prev) {
    const prevTier = new Map(prev.blocks.map(b => [b.id, b.tier]));
    for (const b of blocks) {
      const was = prevTier.get(b.id);
      if (!was) continue;
      const jump = Math.abs(TIERS.indexOf(b.tier) - TIERS.indexOf(was));
      if (jump > 1) fail('M16', `"${b.id}" jumped ${was} -> ${b.tier}. One tier per turn.`);
    }
    const union = new Set([...prevTier.keys(), ...seen]);
    let changed = 0;
    for (const id of union) {
      const a = prev.blocks.find(x => x.id === id);
      const c = blocks.find(x => x.id === id);
      if (!a || !c || JSON.stringify(a) !== JSON.stringify(c)) changed++;
    }
    changedShare = union.size ? changed / union.size : 0;
    if (changedShare > 0.5) warnings.push(`M17  ${changed}/${union.size} blocks changed. Explicit transition, not a cross-fade.`);
  }
  return { ok: errors.length === 0, errors, warnings, changedShare };
}
