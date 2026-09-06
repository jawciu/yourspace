import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { NextResponse } from 'next/server';
import { UIPlanSchema } from '@/lib/schema';
import { validate, type UIPlan } from '@/lib/validate';
import { systemPrompt, userPrompt, type Turn, type Upload } from '@/lib/prompt';
import { personaById } from '@/lib/data';
import { FIXTURES, pickFixture } from '@/lib/fixtures';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface Body { personaId: string; message: string; history: Turn[]; pinned: string[]; dismissed: string[]; prevFixture?: string | null; memory?: { label: string; value: string }[]; uploads?: Upload[] }

export async function POST(req: Request) {
  const body = (await req.json()) as Body;
  const persona = personaById(body.personaId);
  const prev = body.history.length ? body.history[body.history.length - 1].plan ?? null : null;
  const attempts: { plan: unknown; verdict: ReturnType<typeof validate> }[] = [];

  // Fallback path: no key, or the model failed twice. Hand-written plans keep the demo alive.
  const fallback = (reason: string) => {
    const key = pickFixture(persona.id, body.message, body.prevFixture);
    const plan = key ? FIXTURES[key] : null;
    if (!plan) return NextResponse.json({ error: `No plan. ${reason}`, attempts }, { status: 422 });
    const verdict = validate(plan, prev);
    return NextResponse.json({ plan, verdict, source: 'fixture', fixtureKey: key, reason, attempts });
  };

  if (!process.env.ANTHROPIC_API_KEY) return fallback('ANTHROPIC_API_KEY not set');

  const client = new Anthropic();
  let errors: string[] | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await client.messages.parse({
        model: process.env.PLAN_MODEL ?? 'claude-opus-5',
        max_tokens: 4000,
        system: systemPrompt(),
        messages: [{ role: 'user', content: userPrompt(persona, body.history, body.message, body.pinned, body.dismissed, errors, body.memory ?? [], body.uploads ?? []) }],
        output_config: { effort: 'low', format: zodOutputFormat(UIPlanSchema) },
      });
      if (res.stop_reason === 'refusal' || !res.parsed_output) { errors = ['model returned no plan']; continue; }
      const raw = res.parsed_output as unknown as { blocks: ({ props_json?: string } & Record<string, unknown>)[] } & Record<string, unknown>;
      const plan = { ...raw, blocks: raw.blocks.map(({ props_json, ...b }) => { let props: Record<string, unknown> = {}; try { props = props_json ? JSON.parse(props_json) : {}; } catch { props = { _unparsable: props_json }; } return { ...b, props }; }) } as unknown as UIPlan;
      const verdict = validate(plan, prev);
      attempts.push({ plan, verdict });
      if (verdict.ok) return NextResponse.json({ plan, verdict, source: 'model', attempt: attempt + 1, attempts });
      errors = verdict.errors; // M23: exact rule and value, one retry
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors = [`API error: ${msg}`];
      attempts.push({ plan: null, verdict: { ok: false, errors, warnings: [], changedShare: 0 } });
    }
  }
  return fallback(`model failed twice: ${errors?.join(' | ')}`);
}
