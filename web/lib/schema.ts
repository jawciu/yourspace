import { z } from 'zod';

// Zod mirror of ../spec/ui-plan.schema.json, used for structured output. The validator in
// validate.ts is still run on top: the schema shapes the JSON, the validator enforces the rules.
// props travel as a JSON string (props_json): strict structured output cannot express a free-form
// object, it compiles to an empty one and the model obeys. The route parses it back into props.
export const BlockSchema = z.object({
  id: z.string(),
  component: z.string(),
  intent_class: z.enum(['action', 'input', 'navigation', 'data-display', 'feedback']),
  tier: z.enum(['hero', 'primary', 'supporting', 'ambient']),
  why: z.string(),
  props_json: z.string(),
});

export const UIPlanSchema = z.object({
  intent: z.string(),
  frame: z.enum(['focus', 'compare', 'browse', 'monitor']),
  blocks: z.array(BlockSchema),
  primary_action: z.object({ block_id: z.string(), label: z.string() }),
  question: z.string().optional(),
  memory: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  progress: z.object({ done: z.number(), total: z.number(), label: z.string() }).optional(),
});
