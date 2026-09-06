// Live render: edit a "before" photo (listing scene or an upload) with the model's brief.
import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { RENDERS } from '@/lib/data';
import { uploads } from '@/lib/uploads';

export const runtime = 'nodejs';
export const maxDuration = 120;
const g = globalThis as unknown as { __renderCache?: Map<string, string> };
const cache = g.__renderCache ?? (g.__renderCache = new Map<string, string>());

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// gpt-image-2 has a small per-minute input-image limit. On 429 wait what the message asks and retry.
async function callWithRetry(form: FormData, key: string, attempts = 3): Promise<{ ok: boolean; data: unknown; status: number }> {
  let last: { ok: boolean; data: unknown; status: number } = { ok: false, data: null, status: 0 };
  for (let i = 0; i < attempts; i++) {
    const r = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form });
    const d = await r.json().catch(() => ({}));
    last = { ok: r.ok, data: d, status: r.status };
    if (r.ok) return last;
    const msg: string = (d as { error?: { message?: string } })?.error?.message ?? '';
    if (r.status === 429 || /rate limit/i.test(msg)) {
      const m = msg.match(/try again in (\d+(?:\.\d+)?)\s*s/i);
      const wait = Math.min(45, (m ? Math.ceil(parseFloat(m[1])) : 15) + 2);
      if (i < attempts - 1) { await sleep(wait * 1000); continue; }
    }
    break;
  }
  return last;
}

export async function POST(req: Request) {
  const { scene, brief, image, references } = (await req.json()) as { scene: string; brief: string; image?: string; references?: string[] };
  const refs = (Array.isArray(references) ? references : []).filter(r => typeof r === 'string' && r.startsWith('data:')).slice(0, 4);
  let file: Buffer; let mime = 'image/jpeg';
  if (image?.startsWith('data:')) { const [head, b64] = image.split(','); mime = head.slice(5, head.indexOf(';')) || 'image/jpeg'; file = Buffer.from(b64, 'base64'); }
  else if (RENDERS[scene]) file = await readFile(path.join(process.cwd(), 'public', RENDERS[scene].before));
  else if (uploads.has(scene)) { const u = uploads.get(scene)!; file = u.data; mime = u.mime; }
  else return NextResponse.json({ error: `no photo for ${scene}` }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 503 });
  const key = `${scene}|${brief}|${image ? image.length : 0}|refs${refs.length}:${refs.reduce((a, r) => a + r.length, 0)}`;
  if (cache.has(key)) return NextResponse.json({ image: cache.get(key), cached: true });
  try {
    const form = new FormData();
    form.append('model', 'gpt-image-2');
    form.append('image[]', new Blob([new Uint8Array(file)], { type: mime }), 'before.' + (mime.includes('png') ? 'png' : 'jpg'));
    refs.forEach((r, i) => {
      const [head, b64] = r.split(',');
      const m = head.slice(5, head.indexOf(';')) || 'image/jpeg';
      form.append('image[]', new Blob([new Uint8Array(Buffer.from(b64, 'base64'))], { type: m }), `reference-${i + 1}.` + (m.includes('png') ? 'png' : 'jpg'));
    });
    const lead = refs.length ? 'The first image is the customer\'s real room: keep its camera, framing, room shape and windows. The other images are style references: borrow their materials, colours and mood. ' : '';
    form.append('prompt', `${lead}${brief} Keep the camera, framing, room shape and windows identical. Photoreal.`);
    form.append('size', '1536x1024');
    form.append('quality', 'medium');
    const res = await callWithRetry(form, process.env.OPENAI_API_KEY);
    const d = res.data as { data?: { b64_json?: string }[]; error?: { message?: string } };
    if (!res.ok || !d?.data?.[0]?.b64_json) return NextResponse.json({ error: d?.error?.message ?? 'no image' }, { status: res.status === 429 ? 429 : 502 });
    const image = `data:image/png;base64,${d.data[0].b64_json}`;
    cache.set(key, image);
    return NextResponse.json({ image });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
